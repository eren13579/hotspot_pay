import { ConnectivityPulse } from '../ui'
import { useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { cn } from '../../utils/cn'
import {
  LayoutDashboard, Wifi, Ticket, Users, CreditCard,
  Repeat, Settings, LogOut, ChevronLeft, Shield,
  Store, PlusCircle, Wallet, Receipt, Download,
  Router, UserCheck, ChevronDown, Tag,
} from 'lucide-react'

// ─── Groupes de navigation ───────────────────────────────────────────
const adminNav = [
  { type: 'link', to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  {
    type: 'group', label: 'Hotspots', icon: Store,
    items: [
      { to: '/dashboard/hotspots', icon: Wifi, label: 'Tous les hotspots' },
      { to: '/dashboard/hotspots/new', icon: PlusCircle, label: 'Ajouter' },
    ],
  },
  {
    type: 'group', label: 'Forfaits', icon: Tag,
    items: [
      { to: '/dashboard/forfaits', icon: Tag, label: 'Mes forfaits' },
      { to: '/dashboard/forfaits/new', icon: PlusCircle, label: 'Ajouter un forfait' },
    ],
  },
  {
    type: 'group', label: 'Tickets', icon: Receipt,
    items: [
      { to: '/dashboard/tickets', icon: Receipt, label: 'Mes tickets' },
      { to: '/dashboard/tickets/new', icon: PlusCircle, label: 'Ajouter un ticket' },
    ],
  },
  {
    type: 'group', label: 'Sessions', icon: Users,
    items: [
      { to: '/dashboard/sessions', icon: Users, label: 'Sessions' },
    ],
  },
  {
    type: 'group', label: 'Paiements', icon: CreditCard,
    items: [
      { to: '/dashboard/payments', icon: Wallet, label: 'Paiements' },
      { to: '/dashboard/withdrawals', icon: Download, label: 'Retraits' },
    ],
  },
  {
    type: 'group', label: 'Abonnements', icon: Repeat,
    items: [
      { to: '/dashboard/subscriptions', icon: Repeat, label: 'Abonnements' },
      { to: '/dashboard/plans', icon: UserCheck, label: 'Plans' },
    ],
  },
  {
    type: 'group', label: 'Administration', icon: Shield,
    items: [
      { to: '/dashboard/admin/users', icon: Users, label: 'Utilisateurs' },
      { to: '/dashboard/admin/router-brands', icon: Router, label: 'Marques routeurs' },
      { to: '/dashboard/admin/settings', icon: Settings, label: 'Paramètres' },
    ],
  },
]

const userNav = [
  { type: 'link', to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  {
    type: 'group', label: 'Mes Hotspots', icon: Wifi,
    items: [
      { to: '/dashboard/hotspots', icon: Wifi, label: 'Mes hotspots' },
      { to: '/dashboard/hotspots/new', icon: PlusCircle, label: 'Ajouter' },
    ],
  },
  {
    type: 'group', label: 'Forfaits', icon: Tag,
    items: [
      { to: '/dashboard/forfaits', icon: Tag, label: 'Mes forfaits' },
      { to: '/dashboard/forfaits/new', icon: PlusCircle, label: 'Ajouter un forfait' },
    ],
  },
  {
    type: 'group', label: 'Tickets', icon: Receipt,
    items: [
      { to: '/dashboard/tickets', icon: Receipt, label: 'Mes tickets' },
      { to: '/dashboard/tickets/new', icon: PlusCircle, label: 'Ajouter un ticket' },
    ],
  },
  {
    type: 'group', label: 'Sessions', icon: Users,
    items: [
      { to: '/dashboard/sessions', icon: Users, label: 'Mes sessions' },
    ],
  },
  {
    type: 'group', label: 'Paiements', icon: CreditCard,
    items: [
      { to: '/dashboard/payments', icon: Wallet, label: 'Mes paiements' },
      { to: '/dashboard/withdrawals', icon: Download, label: 'Retraits' },
    ],
  },
  { type: 'link', to: '/dashboard/subscriptions', icon: Repeat, label: 'Mon Abonnement' },
]

// ─── Sous-composant : groupe déroulant ───────────────────────────────
function NavGroup({ group, collapsed, isActiveGroup, onToggle }) {
  const location = useLocation()
  const isActive = isActiveGroup

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50',
          isActive
            ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent',
          collapsed && 'justify-center lg:px-0',
        )}
      >
        <group.icon className="w-5 h-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{group.label}</span>
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', isActive && 'rotate-180')} />
          </>
        )}
      </button>

      {!collapsed && isActive && (
        <div className="ml-3 mt-1 space-y-0.5 border-l border-slate-800 pl-2">
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive: isItemActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50',
                  isItemActive
                    ? 'bg-blue-600/10 text-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/30',
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────────────
export default function Sidebar({ collapsed, onToggle, onLogout }) {
  const role = useSelector((state) => state.auth.role)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const navItems = isAdmin ? adminNav : userNav
  const location = useLocation()

  // Détermine quel groupe est ouvert selon la route actuelle
  const [openGroup, setOpenGroup] = useState(() => {
    const path = location.pathname
    const groups = (isAdmin ? adminNav : userNav).filter(n => n.type === 'group')
    const found = groups.find(g => g.items.some(i => path.startsWith(i.to)))
    return found?.label || null
  })

  const toggleGroup = (label) => {
    setOpenGroup(openGroup === label ? null : label)
  }

  return (
    <>
      {/* Overlay mobile */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-30 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 overflow-hidden',
          collapsed ? 'w-0 lg:w-16 -translate-x-full lg:translate-x-0' : 'w-64 translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-slate-800 shrink-0">
          {collapsed ? (
            /* ── Sidebar réduit : juste le toggle d'ouverture ── */
            <button
              onClick={onToggle}
              className="mx-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden lg:block focus-visible:ring-2 focus-visible:ring-blue-500/50"
              title="Ouvrir le menu"
            >
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          ) : (
            <>
              <Link to="/" className="flex items-center gap-2.5 group flex-1">
                <ConnectivityPulse active size="sm" />
                <span className="text-lg font-bold text-white tracking-tight">
                  Hotspot<span className="text-amber-500">Pay</span>
                </span>
              </Link>
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden lg:block focus-visible:ring-2 focus-visible:ring-blue-500/50"
                title="Réduire le menu"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {navItems.map((item, index) => {
            if (item.type === 'link') {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50',
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent',
                      collapsed && 'justify-center lg:px-0',
                    )
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              )
            }
            if (item.type === 'group') {
              // Vérifie si ce groupe ou l'un de ses items correspond à la route active
              const isActiveGroup = openGroup === item.label

              return (
                <NavGroup
                  key={item.label}
                  group={item}
                  collapsed={collapsed}
                  isActiveGroup={isActiveGroup}
                  onToggle={() => toggleGroup(item.label)}
                />
              )
            }
            return null
          })}
        </nav>

        {/* Déconnexion */}
        <div className="p-2 border-t border-slate-800">
          <button
            onClick={onLogout}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50',
              collapsed && 'justify-center',
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
