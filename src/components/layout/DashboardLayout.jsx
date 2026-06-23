/* eslint-disable no-undef */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu, User, LogOut, ChevronDown, Shield,
  Bell, Sun, Moon, Globe, Search, X,
  AlertTriangle, CheckCircle, Clock,
} from 'lucide-react'
import Sidebar from './Sidebar'
import PlanBadge from '../ui/PlanBadge'
import { useAuth } from '../../hooks/useAuth'
import { useDispatch, useSelector } from 'react-redux'
import { toggleSidebar, toggleTheme, toggleLocale, setSearchQuery } from '../../store/uiSlice'
import { hotspotsApi, adminSettingsApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'
import useSystemSse from '../../hooks/useSystemSse'
import api from '../../api/axios'
import { usePublicSettings, PublicSettingsProvider } from '../../context/PublicSettingsContext'

// ─── Titre de page selon la route ─────────────────────────────────────
const pageTitles = {
  '/dashboard':                  'Dashboard',
  '/dashboard/profile':          'Profil',
  '/dashboard/hotspots':         'Hotspots',
  '/dashboard/hotspots/new':     'Nouveau hotspot',
  '/dashboard/tickets':          'Tickets',
  '/dashboard/sessions':         'Sessions',
  '/dashboard/payments':         'Paiements',
  '/dashboard/withdrawals':      'Retraits',
  '/dashboard/subscriptions':    'Abonnement',
  '/dashboard/plans':            'Plans',
  '/dashboard/admin/users':      'Gestion des utilisateurs',
  '/dashboard/admin/router-brands': 'Marques de routeurs',
  '/dashboard/admin/settings':   'Paramètres système',
  '/dashboard/settings':         'Paramètres',
}

function usePageTitle() {
  const { pathname } = useLocation()
  // Cherche une correspondance exacte d'abord, puis partielle
  const exact = pageTitles[pathname]
  if (exact) return exact
  const fallback = Object.entries(pageTitles)
    .sort(([a], [b]) => b.length - a.length) // plus spécifique d'abord
    .find(([route]) => pathname.startsWith(route))
  return fallback?.[1] || 'Dashboard'
}

// ─── Menu déroulant du profil ────────────────────────────────────────
function ProfileDropdown({ user, isAdmin, theme, onClose }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const items = [
    { icon: User, label: 'Mon profil', action: () => navigate('/dashboard/profile') },
    { type: 'divider' },
    { icon: LogOut, label: 'Se déconnecter', action: logout, danger: true },
  ]

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className={cn(
        'absolute right-0 top-full mt-2 w-64 z-40 rounded-2xl border shadow-2xl overflow-hidden',
        theme === 'dark'
          ? 'bg-slate-900 border-slate-800 shadow-black/50'
          : 'bg-white border-slate-200 shadow-slate-200/50',
      )}>
        <div className={cn('p-4 border-b', theme === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
          <p className={cn('text-sm font-semibold truncate', theme === 'dark' ? 'text-white' : 'text-slate-900')}>
            {user?.fullName || user?.email || 'Utilisateur'}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={cn(
              'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md',
              isAdmin
                ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                : 'text-blue-400 bg-blue-500/10 border border-blue-500/20',
            )}>
              {isAdmin ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
              {isAdmin ? 'Administrateur' : 'Opérateur'}
            </span>
            <PlanBadge planType={user?.planType} theme={theme} />
          </div>
        </div>

        <div className="p-1.5">
          {items.map((item, index) => {
            if (item.type === 'divider') {
              return <div key={index} className={cn('h-px my-1', theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200')} />
            }
            return (
              <button
                key={item.label}
                onClick={() => { item.action(); onClose() }}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left',
                  item.danger
                    ? theme === 'dark' ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                    : theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

// ─── Notification bell ───────────────────────────────────────────────
function NotificationBell() {
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const theme = useSelector((state) => state.ui.theme)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      // Comptes retraits via monitoring API
      const { data: monitoringData } = await api.get('/admin/monitoring/notifications')
      if (monitoringData?.success && monitoringData?.data) {
        const d = monitoringData.data
        const count = d.notificationsTotal || 0
        setUnreadCount(count)

        // Construire la liste
        const items = []
        if (d.pendingWithdrawals > 0) {
          items.push({
            id: 'pending-withdrawals',
            icon: AlertTriangle,
            iconColor: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            title: 'Retraits en attente',
            description: `${d.pendingWithdrawals} retrait${d.pendingWithdrawals > 1 ? 's' : ''} à valider`,
            time: 'Maintenant',
          })
        }
        if (d.withdrawalsToday > 0) {
          items.push({
            id: 'withdrawals-today',
            icon: CheckCircle,
            iconColor: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            title: 'Retraits aujourd\'hui',
            description: `${d.withdrawalsToday} retrait${d.withdrawalsToday > 1 ? 's' : ''} effectué${d.withdrawalsToday > 1 ? 's' : ''}`,
            time: 'Aujourd\'hui',
          })
        }
        setNotifications(items)
      }
    } catch {
      // Silencieux
    } finally {
      setLoading(false)
    }
  }, [])

  // Chargement initial
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // SSE temps réel — rafraîchir les notifications à chaque événement système
  useSystemSse({
    settings_updated: () => fetchNotifications(),
    faq_updated: () => fetchNotifications(),
    // notifications_updated sera supporté quand le backend l'émettra
  })

  return (
    <div className="relative">
      <button
        onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications() }}
        className={cn(
          'relative p-2 rounded-xl transition-all',
          theme === 'dark'
            ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
        )}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold ring-2
            bg-red-500 text-white ring-slate-950 dark:ring-slate-950"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2',
            theme === 'dark' ? 'bg-slate-600 ring-slate-950' : 'bg-slate-300 ring-white',
          )} />
        )}
      </button>

      {notifOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
          <div className={cn(
            'absolute right-0 top-full mt-2 z-40 rounded-2xl border shadow-2xl overflow-hidden',
            'w-[calc(100vw-2rem)] sm:w-80',
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800 shadow-black/50'
              : 'bg-white border-slate-200 shadow-slate-200/50',
          )}>
            <div className={cn('p-3 border-b flex items-center justify-between', theme === 'dark' ? 'border-slate-800' : 'border-slate-200')}>
              <p className={cn('text-xs font-semibold', theme === 'dark' ? 'text-white' : 'text-slate-900')}>
                Notifications
                {unreadCount > 0 && (
                  <span className={cn('ml-1.5 text-[10px] font-normal', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>
                    · {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </p>
              {loading && <Clock className="w-3 h-3 text-slate-500 animate-spin" />}
            </div>

            {notifications.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className={cn(
                    'flex items-start gap-3 px-4 py-3 border-b last:border-0 transition-colors',
                    theme === 'dark' ? 'border-slate-800 hover:bg-slate-800/30' : 'border-slate-100 hover:bg-slate-50',
                  )}>
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', n.bgColor)}>
                      <n.icon className={cn('w-4 h-4', n.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs font-medium', theme === 'dark' ? 'text-white' : 'text-slate-900')}>
                        {n.title}
                      </p>
                      <p className={cn('text-[11px] mt-0.5', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
                        {n.description}
                      </p>
                    </div>
                    <span className={cn('text-[10px] shrink-0', theme === 'dark' ? 'text-slate-600' : 'text-slate-400')}>
                      {n.time}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={cn('p-6 text-center text-xs', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>
                {loading ? 'Chargement...' : 'Aucune notification'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Bannière de maintenance ─────────────────────────────────────────
function MaintenanceBanner({ theme }) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-4 py-2 text-[11px] font-medium border-b',
      'bg-amber-500/10 border-amber-500/20 text-amber-400',
      'animate-slide-down',
    )}>
      <div className="relative w-4 h-4 shrink-0">
        <svg className="w-4 h-4 animate-spin-reverse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <span className="flex-1">Mode maintenance activé — les utilisateurs ne peuvent pas accéder au service.</span>
      <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold animate-pulse-soft">ADMIN SEULEMENT</span>
    </div>
  )
}

// ─── Layout principal ────────────────────────────────────────────────
function DashboardContent() {
  const dispatch = useDispatch()
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen)
  const theme = useSelector((state) => state.ui.theme)
  const locale = useSelector((state) => state.ui.locale)
  const { user, userId, role, isAuthenticated, logout, loadProfile } = useAuth()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const { settings } = usePublicSettings()
  const maintenanceMode = settings.maintenanceMode
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const pageTitle = usePageTitle()
  const [searchInput, setSearchInput] = useState('')

  // Synchroniser la classe theme sur <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  // Charger le profil et vérifier les hotspots au montage (une seule fois)
  const initRef = useRef(false)
  useEffect(() => {
    if (!isAuthenticated) { initRef.current = false; return }
    if (initRef.current) return
    initRef.current = true

    const init = async () => {
      if (window.location.pathname.startsWith('/onboarding')) return

      // Charger le profil si nécessaire (toujours si fullName manque)
      let uid = userId
      if (!user || !user.fullName) {
        const result = await loadProfile()
        if (result.ok) uid = result.userId || uid
      }

      // Vérifier si l'utilisateur a au moins un hotspot
      if (uid) {
        try {
          const { data } = await hotspotsApi.list(uid, 0, 1)
          if (data.success) {
            const hotspots = data.data?.content || data.data || []
            if (Array.isArray(hotspots) && hotspots.length === 0 && window.location.pathname === '/dashboard') {
              navigate('/onboarding', { replace: true })
            }
          }
        } catch { /* silencieux */ }
      }
    }
    init()
  }, [isAuthenticated, loadProfile, user, userId])

  // Debounce la recherche dans le store
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setSearchQuery(searchInput))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, dispatch])

  // ── Mode maintenance ──
  if (maintenanceMode && !isAdmin) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center h-screen p-6 relative',
        theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900',
      )}>
        {/* Bouton déconnexion en haut à droite */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={logout}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              theme === 'dark'
                ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20'
                : 'text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200',
            )}
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="max-w-md text-center space-y-4 animate-fade-in-up">
          <div className={cn(
            'w-16 h-16 rounded-full border flex items-center justify-center mx-auto',
            theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
          )}>
            <svg className="w-8 h-8 text-slate-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Site en maintenance</h1>
          <p className={cn('text-sm', theme === 'dark' ? 'text-slate-400' : 'text-slate-500')}>
            Nous effectuons des opérations de maintenance. Revenez dans quelques instants.
          </p>
        </div>
      </div>
    )
  }

  const locales = {
    fr: { label: 'FR', flag: '🇫🇷' },
    en: { label: 'EN', flag: '🇬🇧' },
  }
  const currentLocale = locales[locale] || locales.fr

  return (
    <div className={cn(
      'flex h-screen overflow-hidden transition-colors duration-200',
      theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900',
    )}>
      <Sidebar
        collapsed={!sidebarOpen}
        onToggle={() => dispatch(toggleSidebar())}
        onLogout={logout}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className={cn(
          'h-16 flex items-center gap-2 px-4 lg:px-6 shrink-0 border-b transition-colors duration-200',
          theme === 'dark'
            ? 'bg-slate-950 border-slate-800'
            : 'bg-white border-slate-200',
        )}>
          {/* Hamburger mobile */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className={cn(
              'p-2 rounded-lg transition-colors lg:hidden',
              theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
            )}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Titre de page */}
          <h1 className={cn(
            'text-sm font-semibold tracking-tight hidden sm:block',
            theme === 'dark' ? 'text-white' : 'text-slate-900',
          )}>
            {pageTitle}
          </h1>

          {/* Barre de recherche */}
          <div className="relative hidden sm:block max-w-xs w-full mx-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher..."
              className={cn(
                'w-full h-9 pl-9 pr-8 rounded-xl text-xs outline-none transition-all',
                theme === 'dark'
                  ? 'bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20'
                  : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20',
              )}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors',
                  theme === 'dark' ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-900',
                )}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Plan badge */}
          {user && (
            <div className="hidden sm:block">
              <PlanBadge planType={user.planType} theme={theme} />
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className={cn(
              'p-2 rounded-xl transition-all',
              theme === 'dark'
                ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
            )}
            title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all',
                theme === 'dark'
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100',
              )}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{currentLocale.label}</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform hidden sm:block', langOpen && 'rotate-180')} />
            </button>

            {langOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setLangOpen(false)} />
                <div className={cn(
                  'absolute right-0 top-full mt-1 z-40 w-28 rounded-xl border shadow-xl overflow-hidden',
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200',
                )}>
                  {Object.entries(locales).map(([key, { label, flag }]) => (
                    <button
                      key={key}
                      onClick={() => { dispatch(toggleLocale()); setLangOpen(false) }}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition-all',
                        locale === key
                          ? theme === 'dark' ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50'
                          : theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
                      )}
                    >
                      <span>{flag}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

           {/* Notification bell */}
          <div className="block">
            <NotificationBell />
          </div>

          {/* Profil utilisateur */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className={cn(
                'flex items-center gap-2.5 p-1.5 pr-3 rounded-xl transition-all cursor-pointer',
                theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-100',
              )}
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/20">
                {user?.fullName ? user.fullName[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U'}
              </div>
              <div className="block text-left min-w-0">
                <p className={cn('text-xs font-medium leading-tight truncate max-w-20 sm:max-w-32', theme === 'dark' ? 'text-white' : 'text-slate-900')}>
                  {user?.fullName || user?.email || 'Utilisateur'}
                </p>
                <p className={cn('text-[10px] leading-tight hidden sm:block', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>
                  {isAdmin ? 'Administrateur' : 'Opérateur'}
                </p>
              </div>
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', theme === 'dark' ? 'text-slate-500' : 'text-slate-400', profileOpen && 'rotate-180')} />
            </button>

            {profileOpen && (
              <ProfileDropdown
                user={user}
                isAdmin={isAdmin}
                theme={theme}
                onClose={() => setProfileOpen(false)}
              />
            )}
          </div>
        </header>

        {/* Bannière mode maintenance (admin seulement) */}
        {maintenanceMode && isAdmin && <MaintenanceBanner theme={theme} />}

        {/* Page content */}
        <main className={cn(
          'flex-1 overflow-y-auto p-4 lg:p-6 transition-colors duration-200 relative',
          theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50',
        )}>
          {/* Halo lumineux ambiant — comme un routeur qui éclaire */}
          <div className="fixed top-1/4 right-1/3 w-96 h-96 bg-amber-500/3 rounded-full blur-[140px] pointer-events-none animate-glow-ambient hidden lg:block" />
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

// ─── Wrapper avec accès aux paramètres publics ───────────────────────
export default function DashboardLayout() {
  return (
    <PublicSettingsProvider>
      <DashboardContent />
    </PublicSettingsProvider>
  )
}
