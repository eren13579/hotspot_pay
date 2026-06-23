import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  HelpCircle, ChevronDown, Mail, MessageCircle, BookOpen,
  Wifi, CreditCard, Download, Tag, Repeat, Settings,
  Search, LifeBuoy, ExternalLink,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'
import { faqApi } from '../../api/endpoints'
import { usePublicSettings } from '../../context/PublicSettingsContext'
import useSystemSse from '../../hooks/useSystemSse'

/* ─── Mapping catégories ──────────────────────────────────── */
const CATEGORY_META = {
  'getting-started': { label: 'Démarrage', icon: Wifi },
  'payments':         { label: 'Paiements', icon: CreditCard },
  'withdrawals':      { label: 'Retraits', icon: Download },
  'plans-tickets':    { label: 'Forfaits & Tickets', icon: Tag },
  'subscriptions':    { label: 'Abonnements', icon: Repeat },
  'troubleshooting':  { label: 'Dépannage', icon: Settings },
}

/* ── Squelette de chargement ──────────────────────────────── */
function SupportSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-slate-700" />
        <div className="space-y-1.5">
          <div className="h-4 w-40 rounded bg-slate-700" />
          <div className="h-3 w-56 rounded bg-slate-700/50" />
        </div>
      </div>
      <div className="h-10 rounded-xl bg-slate-700/50" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 h-64 rounded-2xl bg-slate-700/30" />
        <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-700/30" />
        <div className="lg:col-span-1 h-48 rounded-2xl bg-slate-700/30" />
      </div>
    </div>
  )
}

/* ── Accordion Item ──────────────────────────────────────── */
function AccordionItem({ q, a, isOpen, onToggle, isLight }) {
  return (
    <div className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
      <button onClick={onToggle}
        className={cn('flex items-center justify-between w-full px-4 py-3.5 text-left transition-all cursor-pointer',
          isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30')}>
        <span className={cn('text-xs font-medium', isLight ? 'text-slate-800' : 'text-slate-200')}>{q}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 ml-2 transition-transform duration-200', isOpen && 'rotate-180',
          isLight ? 'text-slate-400' : 'text-slate-500')} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className={cn('px-4 pb-4 text-[11px] leading-relaxed', isLight ? 'text-slate-600' : 'text-slate-400')}>
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════ */
export default function SupportPage() {
  const theme = useSelector(state => state.ui.theme)
  const isLight = theme === 'light'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const cardCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'

  const { settings } = usePublicSettings()

  const [activeCat, setActiveCat] = useState('getting-started')
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState(new Set())
  const [faqData, setFaqData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadFaqs = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    faqApi.list()
      .then(({ data }) => {
        if (!cancelled) setFaqData(data.data || {})
      })
      .catch(err => {
        if (!cancelled) setError(err.response?.data?.message || 'Impossible de charger la FAQ')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Chargement initial
  useEffect(() => {
    const cleanup = loadFaqs()
    return cleanup
  }, [loadFaqs])

  // SSE temps réel — dès que l'admin modifie la FAQ, recharger immédiatement
  useSystemSse({
    faq_updated: () => loadFaqs(),
  })

  // Auto-refresh au retour sur l'onglet
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadFaqs()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [loadFaqs])

  const toggleItem = (key) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Construire les catégories à partir des données API
  const categories = useMemo(() => {
    if (!faqData) return []

    const cats = Object.entries(CATEGORY_META).map(([id, meta]) => {
      const items = (faqData[id] || []).map((item, idx) => ({
        key: `${id}-${idx}`,
        q: item.question,
        a: item.answer,
      }))
      return { id, ...meta, items }
    }).filter(c => c.items.length > 0 || !searchQuery)

    if (!searchQuery) return cats
    const q = searchQuery.toLowerCase()
    return cats.map(cat => ({
      ...cat,
      items: cat.items.filter(item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)),
    })).filter(cat => cat.items.length > 0)
  }, [faqData, searchQuery])

  const activeCategory = categories.find(c => c.id === activeCat) || categories[0]
  const totalResults = categories.reduce((sum, c) => sum + c.items.length, 0)

  // Options de contact dynamiques depuis les paramètres système
  const contactOptions = useMemo(() => [
    { icon: Mail, label: 'Email', value: settings.supportEmail, href: `mailto:${settings.supportEmail}` },
    { icon: MessageCircle, label: 'WhatsApp', value: settings.whatsappNumber, href: `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}` },
    ...(settings.docsEnabled
      ? [{ icon: BookOpen, label: 'Documentation', value: 'Guide complet en ligne', href: settings.docsUrl }]
      : []),
  ], [settings.supportEmail, settings.whatsappNumber, settings.docsEnabled, settings.docsUrl])

  // ── Loading ──
  if (loading) return <SupportSkeleton />

  // ── Error ──
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', isLight ? 'bg-sky-50 text-sky-600' : 'bg-sky-500/10 text-sky-400')}>
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <h1 className={cn('text-xl font-black tracking-tight', textPrimary)}>Aide & Support</h1>
          </div>
        </div>
        <div className={cn('rounded-2xl border p-8 text-center', cardCls)}>
          <HelpCircle className={cn('w-10 h-10 mx-auto mb-3', textMuted)} />
          <p className={cn('text-xs mb-3', textSecondary)}>{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-sky-500/10 text-sky-400 text-xs font-medium hover:bg-sky-500/20 transition-colors cursor-pointer">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', isLight ? 'bg-sky-50 text-sky-600' : 'bg-sky-500/10 text-sky-400')}>
          <LifeBuoy className="w-5 h-5" />
        </div>
        <div>
          <h1 className={cn('text-xl font-black tracking-tight', textPrimary)}>Aide & Support</h1>
          <p className={cn('text-[11px]', textSecondary)}>Trouvez rapidement une réponse à vos questions</p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border', isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800')}>
        <Search className={cn('w-4 h-4', textMuted)} />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher dans la FAQ..."
          className={cn('flex-1 bg-transparent outline-none text-xs', textPrimary, 'placeholder:text-slate-500')} />
        {searchQuery && (
          <span className={cn('text-[10px]', textMuted)}>{totalResults} résultat{totalResults !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Sidebar catégories ── */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className={cn('rounded-2xl overflow-hidden border', isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800')}>
            {categories.map(cat => {
              const active = activeCat === cat.id
              const Icon = cat.icon
              return (
                <button key={cat.id} onClick={() => { setActiveCat(cat.id); setOpenItems(new Set()) }}
                  className={cn('flex items-center gap-3 w-full px-4 py-3 text-left transition-all cursor-pointer border-b',
                    isLight ? 'border-slate-100' : 'border-slate-800',
                    active ? (isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400') : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'))}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium">{cat.label}</span>
                  <span className={cn('ml-auto text-[10px]', textMuted)}>{cat.items.length}</span>
                </button>
              )
            })}
            {categories.length === 0 && (
              <div className="p-4 text-center">
                <p className={cn('text-[11px]', textMuted)}>Aucune catégorie disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* ── FAQ Content ── */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          {activeCategory && activeCategory.items.length > 0 ? (
            <motion.div key={activeCat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-2xl overflow-hidden border', cardCls)}>
              <div className={cn('px-4 py-3 border-b font-bold text-xs', isLight ? 'border-slate-200 text-slate-800' : 'border-slate-800 text-white')}>
                {activeCategory.label}
              </div>
              {activeCategory.items.map((item) => (
                <AccordionItem key={item.key} q={item.q} a={item.a}
                  isOpen={openItems.has(item.key)} onToggle={() => toggleItem(item.key)}
                  isLight={isLight} />
              ))}
            </motion.div>
          ) : (
            <div className={cn('rounded-2xl border p-8 text-center', cardCls)}>
              <HelpCircle className={cn('w-8 h-8 mx-auto mb-2', textMuted)} />
              <p className={cn('text-xs', textSecondary)}>
                {searchQuery
                  ? 'Aucun résultat trouvé. Essayez d\'autres mots-clés.'
                  : 'Aucune FAQ disponible pour le moment. Revenez plus tard.'}
              </p>
            </div>
          )}
        </div>

        {/* ── Contact sidebar ── */}
        <div className="lg:col-span-1 order-3">
          <div className={cn('rounded-2xl border p-4 space-y-3', cardCls)}>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className={cn('w-4 h-4', textPrimary)} />
              <h3 className={cn('text-xs font-bold', textPrimary)}>Nous contacter</h3>
            </div>
            {contactOptions.map(opt => (
              <a key={opt.label} href={opt.href} target="_blank" rel="noopener noreferrer"
                className={cn('flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer',
                  isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30')}>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400')}>
                  <opt.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[10px] font-medium', textPrimary)}>{opt.label}</p>
                  <p className={cn('text-[10px] truncate', textMuted)}>{opt.value}</p>
                </div>
                <ExternalLink className={cn('w-3 h-3 shrink-0', textMuted)} />
              </a>
            ))}
            {contactOptions.length === 0 && (
              <p className={cn('text-[10px] text-center py-2', textMuted)}>Aucun moyen de contact disponible</p>
            )}
          </div>

          {/* Status */}
          <div className={cn('rounded-2xl border p-4 mt-3 space-y-2', cardCls)}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={cn('text-[10px] font-medium', textPrimary)}>Tous les systèmes opérationnels</span>
            </div>
            <p className={cn('text-[10px]', textMuted)}>
              Temps de réponse estimé : <strong>2-4h</strong> ouvrées
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
