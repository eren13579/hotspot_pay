import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Save, Loader2, RefreshCw, Settings,
  SlidersHorizontal, Palette, Info, CreditCard,
  Server, Globe, Shield, Bell, ChevronRight, MessageCircle, Download, LifeBuoy,
  Webhook,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { adminSettingsApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'
import GeneralSection from '../../components/settings/GeneralSection'
import BrandingSection from '../../components/settings/BrandingSection'
import AboutSection from '../../components/settings/AboutSection'
import PaymentsSection from '../../components/settings/PaymentsSection'
import FastApiSection from '../../components/settings/FastApiSection'
import PortalSection from '../../components/settings/PortalSection'
import SecuritySection from '../../components/settings/SecuritySection'
import NotificationsSection from '../../components/settings/NotificationsSection'
import FAQSection from '../../components/settings/FAQSection'
import WithdrawalsSection from '../../components/settings/WithdrawalsSection'
import SupportSection from '../../components/settings/SupportSection'
import WebhooksSection from '../../components/settings/WebhooksSection'

const SECTIONS = [
  { key: 'general',       label: 'Général',      icon: SlidersHorizontal },
  { key: 'branding',      label: 'Marque',       icon: Palette },
  { key: 'about',         label: 'À propos',     icon: Info },
  { key: 'payments',      label: 'Paiements',    icon: CreditCard },
  { key: 'fastapi',       label: 'FastAPI',      icon: Server },
  { key: 'portal',        label: 'Portail',      icon: Globe },
  { key: 'security',      label: 'Sécurité',     icon: Shield },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'withdrawals',   label: 'Retraits',     icon: Download },
  { key: 'support',       label: 'Support',      icon: LifeBuoy },
  { key: 'faq',           label: 'FAQ',          icon: MessageCircle },
  { key: 'webhooks',      label: 'Webhooks',     icon: Webhook },
]

const SECTION_MAP = {
  general: GeneralSection,
  branding: BrandingSection,
  about: AboutSection,
  payments: PaymentsSection,
  fastapi: FastApiSection,
  portal: PortalSection,
  security: SecuritySection,
  notifications: NotificationsSection,
  withdrawals: WithdrawalsSection,
  support: SupportSection,
  faq: FAQSection,
  webhooks: WebhooksSection,
}

const SECTION_ORDER = SECTIONS.map((s) => s.key)

// ─── Animations ────────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}
const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
}

// ─── Squelette ─────────────────────────────────────────────────────────────
function SettingsSkeleton() {
  return (
    <div className="flex gap-6">
      <div className="hidden lg:block w-56 shrink-0 space-y-1">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-10 rounded-xl bg-slate-800/60 animate-pulse" />
        ))}
      </div>
      <div className="flex-1 space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl p-6 space-y-4 animate-pulse bg-slate-900/40 border border-slate-800/60 backdrop-blur-xl">
            <div className="h-5 w-44 rounded-lg bg-slate-800" />
            <div className="h-10 rounded-xl bg-slate-800" />
            <div className="h-10 rounded-xl bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page principale ────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const { role } = useSelector((state) => state.auth)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'

  const [sections, setSections] = useState([])
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('general')

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await adminSettingsApi.get()
      const settings = data?.data
      if (settings?.sections) {
        const ordered = SECTION_ORDER
          .map((key) => settings.sections.find((s) => s.key === key))
          .filter(Boolean)
        const remaining = settings.sections.filter((s) => !SECTION_ORDER.includes(s.key))
        setSections([...ordered, ...remaining])

        const flat = {}
        settings.sections.forEach((section) => {
          section.items.forEach((item) => {
            flat[item.key] = item.value ?? ''
          })
        })
        setValues(flat)
      }
    } catch (err) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleChange = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        settings: Object.entries(values).map(([key, value]) => ({ key, value })),
      }
      const { data } = await adminSettingsApi.update(payload)
      if (data?.success) {
        toast.success('Paramètres système mis à jour', {
          description: 'Les modifications ont été appliquées avec succès.',
        })
        await fetchSettings()
      } else {
        toast.error(data?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  // ── Sécurité : admin uniquement ──
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  // ── Loading ──
  if (loading) return <SettingsSkeleton />

  // ── Error ──
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-black/20 p-8 text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <RefreshCw className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-sm text-red-400 font-medium">{error}</p>
          <button
            onClick={fetchSettings}
            aria-label="Réessayer le chargement"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all cursor-pointer active:scale-[0.97]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0)
  const activeSection = sections.find((s) => s.key === activeTab)
  const SectionComponent = activeTab ? SECTION_MAP[activeTab] : null

  const hasChanges = sections.length > 0

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ── Header ── */}
      <motion.div variants={itemAnim} className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-xl shadow-amber-500/20">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Paramètres système</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalItems} paramètres · {sections.length} sections
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          aria-label="Enregistrer tous les paramètres"
          className={cn(
            'relative inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200',
            'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400',
            'text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'active:scale-[0.97]',
            'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          )}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Sauvegarde…' : 'Tout enregistrer'}
        </button>
      </motion.div>

      {/* ─── Tabs mobiles (horizontal scroll, hors du flex desktop) ─── */}
      <div className="lg:hidden overflow-x-auto -mx-4 px-4 pb-2 scrollbar-none">
        <div className="flex gap-1.5 min-w-max">
          {SECTIONS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key
            return (
              <button
                key={key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${key}`}
                id={`tab-${key}`}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-medium transition-all duration-200 whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                    : 'text-slate-400 border border-transparent hover:text-white hover:bg-slate-800/40',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Corps : Sidebar + Contenu ── */}
      <div className="flex gap-6">
        {/* ─── Sidebar navigation desktop ─── */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 gap-1">
          <nav className="space-y-0.5">
            {SECTIONS.map(({ key, label, icon: Icon }) => {
              const section = sections.find((s) => s.key === key)
              const itemCount = section?.items?.length || 0
              const isActive = activeTab === key
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${key}`}
                  id={`tab-${key}`}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 text-left group cursor-pointer',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/15 to-blue-600/5 border border-blue-500/25 shadow-sm shadow-blue-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent',
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                    isActive
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'text-slate-500 group-hover:text-blue-400 group-hover:bg-blue-500/5',
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1">{label}</span>
                  <ChevronRight className={cn(
                    'w-3 h-3 transition-all duration-200',
                    isActive ? 'text-blue-400 opacity-100 translate-x-0' : 'text-slate-600 opacity-0 -translate-x-1',
                  )} />
                </button>
              )
            })}
          </nav>

          {/* Compteur */}
          <div className="mt-4 pt-4 border-t border-slate-800/50 px-3.5">
            <p className="text-[10px] text-slate-600">
              {activeTab === 'faq' ? (
                'FAQ gérées par l\'administrateur'
              ) : (
                <><span className="text-blue-400 font-semibold">{activeSection?.items?.length || 0}</span> paramètres dans cette section</>
              )}
            </p>
          </div>
        </aside>

        {/* ─── Contenu de la section active ─── */}
        <motion.div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          key={activeTab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex-1 min-w-0 space-y-5"
        >
          {activeTab === 'faq' ? (
            <FAQSection />
          ) : SectionComponent && activeSection ? (
            <SectionComponent
              items={activeSection.items}
              values={values}
              onChange={handleChange}
              saving={saving}
            />
          ) : (
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-black/20 p-10 text-center">
              <Settings className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Section introuvable</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
