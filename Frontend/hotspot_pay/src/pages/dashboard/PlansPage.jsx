/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Crown, Shield, Wifi, Plus, Edit3, Trash2, Star, ToggleLeft, ToggleRight, X, RefreshCw, Check, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { subscriptionsApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/cn'
import { formatXAF } from '../../utils/format'
import EmptyState, { LoadingSkeleton, ErrorState } from '../../components/ui/EmptyState'
import ConfirmModal from '../../components/ui/ConfirmModal'

const PLAN_ICONS = { BASIC: Wifi, PRO: Shield, PREMIUM: Crown }
const PLAN_COLORS = {
  BASIC: (isLight) => isLight ? 'text-slate-500 bg-slate-100' : 'text-slate-400 bg-slate-800',
  PRO: (isLight) => isLight ? 'text-blue-600 bg-blue-50' : 'text-blue-400 bg-blue-500/10',
  PREMIUM: (isLight) => isLight ? 'text-amber-600 bg-amber-50' : 'text-amber-400 bg-amber-500/10',
}

/* ─── Features checkboxes mapping ─────────────────────────────── */
const FEATURES_DEF = [
  { key: 'exportCsv',        label: 'Export CSV',                type: 'toggle',    default: false },
  { key: 'advancedStats',    label: 'Statistiques avancées',     type: 'toggle',    default: false },
  { key: 'prioritySupport',  label: 'Support prioritaire',       type: 'toggle',    default: false },
  { key: 'unlimitedHotspots',label: 'Hotspots illimités',        type: 'toggle',    default: false },
  { key: 'unlimitedTickets', label: 'Tickets illimités',         type: 'toggle',    default: false },
  { key: 'unlimitedPlans',   label: 'Forfaits illimités',        type: 'toggle',    default: false },
]

const API_ACCESS_OPTIONS = [
  { value: 'none', label: 'Aucun' },
  { value: 'read', label: 'Lecture seule' },
  { value: 'full', label: 'Complet' },
]

/* ─── Default advantages ─────────────────────────────────────── */
const DEFAULT_ADVANTAGES = {
  maxHotspots: 1,
  plansPerHotspot: 5,
  monthlyTickets: 100,
  exportCsv: false,
  apiAccess: 'none',
  advancedStats: false,
  prioritySupport: false,
  unlimitedHotspots: false,
  unlimitedTickets: false,
  unlimitedPlans: false,
}

const defaultForm = {
  planName: '',
  monthlyPrice: '',
  yearlyPrice: '',
  maxHotspots: '',
  description: '',
  isPopular: false,
  advantages: { ...DEFAULT_ADVANTAGES },
}

export default function PlansPage() {
  const theme = useSelector((state) => state.ui.theme)
  const { role } = useAuth()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const isLight = theme === 'light'

  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const cardCls = isLight ? 'bg-white border border-slate-200 shadow-sm' : 'bg-slate-900/30 border border-slate-700/50'
  const inputCls = isLight
    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'
    : 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'

  // ── Data ─────────────────────────────────────────────────────────────
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actioning, setActioning] = useState(false)

  // ── Modal ────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [form, setForm] = useState(defaultForm)

  // ── Delete confirm ───────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState(null)

  // ── Advantages expand ───────────────────────────────────────────────
  const [showAdvEditor, setShowAdvEditor] = useState(false)

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await subscriptionsApi.adminList()
      const data = res?.data?.data || []
      setPlans(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  // ── Form helpers ─────────────────────────────────────────────────────
  const getAdvantages = (plan) => plan.advantages || DEFAULT_ADVANTAGES

  const openCreate = () => {
    setEditingPlan(null)
    setForm({ ...defaultForm, advantages: { ...DEFAULT_ADVANTAGES } })
    setShowAdvEditor(false)
    setShowModal(true)
  }

  const openEdit = (plan) => {
    setEditingPlan(plan)
    const advantages = getAdvantages(plan)
    setForm({
      planName: plan.planName || plan.plan_name || '',
      monthlyPrice: String(plan.monthlyPrice ?? plan.monthly_price ?? 0),
      yearlyPrice: String(plan.yearlyPrice ?? plan.yearly_price ?? 0),
      maxHotspots: String(advantages.maxHotspots ?? plan.maxHotspots ?? plan.max_hotspots ?? 1),
      description: plan.description || '',
      isPopular: plan.isPopular || plan.is_popular || false,
      advantages: { ...advantages },
    })
    setShowAdvEditor(true)
    setShowModal(true)
  }

  const setAdv = (key, value) => {
    setForm((prev) => ({
      ...prev,
      advantages: { ...prev.advantages, [key]: value },
    }))
  }

  // ── Save ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.planName.trim()) {
      toast.error('Nom du plan requis')
      return
    }
    const monthly = Number(form.monthlyPrice)
    if (!monthly || monthly <= 0) {
      toast.error('Prix mensuel invalide')
      return
    }

    const payload = {
      planName: form.planName.trim().toUpperCase(),
      monthlyPrice: monthly,
      yearlyPrice: Number(form.yearlyPrice) || 0,
      maxHotspots: Number(form.maxHotspots) || 1,
      description: form.description,
      isPopular: form.isPopular,
      advantages: form.advantages,
    }

    setActioning(true)
    try {
      const fn = editingPlan
        ? subscriptionsApi.adminUpdate(editingPlan.id || editingPlan.planName, payload)
        : subscriptionsApi.adminCreate(payload)
      const { data } = await fn
      if (data?.success || data?.success !== false) {
        toast.success(editingPlan ? 'Plan modifié' : 'Plan créé')
        setShowModal(false)
        fetchPlans()
      } else {
        toast.error(data?.message || 'Erreur')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur d'enregistrement")
    } finally {
      setActioning(false)
    }
  }

  // ── Toggle popular ──────────────────────────────────────────────────
  const handleTogglePopular = async (plan) => {
    try {
      const { data } = await subscriptionsApi.adminTogglePopular(plan.id || plan.planName)
      if (data?.success || data?.success !== false) {
        toast.success(plan.isPopular ? 'Populaire désactivé' : 'Marqué comme populaire')
        fetchPlans()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const { data } = await subscriptionsApi.adminDelete(deleteId)
      if (data?.success || data?.success !== false) {
        toast.success('Plan supprimé')
        setDeleteId(null)
        fetchPlans()
      } else {
        toast.error(data?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-11 h-11 rounded-2xl bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-5 w-40 bg-slate-800 rounded-lg" />
            <div className="h-4 w-24 bg-slate-800 rounded-lg" />
          </div>
        </div>
        <LoadingSkeleton type="card" isLight={isLight} rows={3} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400')}>
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h1 className={cn('text-xl font-black tracking-tight', textPrimary)}>Plans d'abonnement</h1>
            <p className={cn('text-xs', textSecondary)}>{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPlans}
            className={cn('flex items-center justify-center w-9 h-9 rounded-xl transition-all cursor-pointer', isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800')}>
            <RefreshCw className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button onClick={openCreate}
              className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer', isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')}>
              <Plus className="w-3.5 h-3.5" /> Nouveau plan
            </button>
          )}
        </div>
      </div>

      {error && <ErrorState error={error} onRetry={fetchPlans} isLight={isLight} title="Erreur de chargement" />}

      {!error && (
        <>
          {plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan, idx) => {
                const name = plan.planName || plan.plan_name || 'STANDARD'
                const advantages = getAdvantages(plan)
                const Icon = PLAN_ICONS[name] || Wifi
                const iconColor = PLAN_COLORS[name] || PLAN_COLORS.BASIC
                return (
                  <motion.div key={plan.id || name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    className={cn('rounded-2xl border p-5 relative', cardCls)}>
                    {plan.isPopular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1 z-10">
                        <Star className="w-3 h-3" /> Populaire
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconColor(isLight))}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={cn('text-sm font-bold', textPrimary)}>{name}</h3>
                        {plan.description && <p className={cn('text-[10px]', textSecondary)}>{plan.description}</p>}
                      </div>
                    </div>
                    <div className="mb-4">
                      <span className={cn('text-2xl font-black', textPrimary)}>{formatXAF(plan.monthlyPrice || plan.monthly_price || 0)}</span>
                      <span className={cn('text-[10px] ml-1', textMuted)}>/ mois</span>
                      <div className={cn('text-[10px] mt-0.5', textSecondary)}>
                        {formatXAF(plan.yearlyPrice || plan.yearly_price || 0)} / an
                      </div>
                    </div>

                    {/* Features tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {[
                        advantages.exportCsv && 'Export CSV',
                        advantages.advancedStats && 'Stats avancées',
                        advantages.prioritySupport && 'Support prioritaire',
                        advantages.unlimitedHotspots && 'Hotspots ∞',
                        advantages.unlimitedTickets && 'Tickets ∞',
                        advantages.unlimitedPlans && 'Forfaits ∞',
                        advantages.apiAccess === 'read' && 'API(L)',
                        advantages.apiAccess === 'full' && 'API',
                      ].filter(Boolean).slice(0, 4).map((tag) => (
                        <span key={tag} className={cn(
                          'px-1.5 py-0.5 rounded-md text-[9px] font-semibold',
                          isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400',
                        )}>
                          {tag}
                        </span>
                      ))}
                      {plan.maxHotspots && (
                        <span className={cn('px-1.5 py-0.5 rounded-md text-[9px] font-semibold', isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400')}>
                          {advantages.unlimitedHotspots ? '∞ hotspots' : `${plan.maxHotspots} hotspot${plan.maxHotspots > 1 ? 's' : ''}`}
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <div className={cn('pt-3 border-t flex items-center gap-1 justify-end', isLight ? 'border-slate-100' : 'border-slate-700/50')}>
                        <button onClick={() => handleTogglePopular(plan)}
                          className={cn('p-1.5 rounded-lg transition-all cursor-pointer', isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800')}
                          title={plan.isPopular ? 'Enlever populaire' : 'Marquer populaire'}>
                          {plan.isPopular ? <ToggleRight className="w-4 h-4 text-amber-500" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEdit(plan)}
                          className={cn('p-1.5 rounded-lg transition-all cursor-pointer', isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800')}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(plan.id || plan.planName)}
                          className={cn('p-1.5 rounded-lg transition-all cursor-pointer', isLight ? 'text-red-400 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10')}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <EmptyState icon={Crown} title="Aucun plan"
              message="Créez votre premier plan d'abonnement pour définir les durées, prix et fonctionnalités proposés à vos hotspots."
              isLight={isLight}
              action={isAdmin ? { label: 'Créer un plan', onClick: openCreate } : undefined}
            />
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════
          Create / Edit modal
          ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={cn('w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden my-8', isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800')}>
              {/* Header */}
              <div className={cn('flex items-center justify-between px-6 py-4 border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                <h2 className={cn('text-base font-bold', textPrimary)}>
                  {editingPlan ? 'Modifier le plan' : 'Nouveau plan'}
                </h2>
                <button onClick={() => setShowModal(false)}
                  className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer', isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800')}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Plan name — input custom (plus de select bloqué) */}
                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Nom du plan</label>
                  <input type="text" value={form.planName}
                    onChange={(e) => setForm({ ...form, planName: e.target.value })}
                    placeholder="Ex: BASIC, PRO, PREMIUM, ENTERPRISE..."
                    className={cn('w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border uppercase', inputCls)}
                  />
                  <p className={cn('text-[10px] mt-1', textMuted)}>Sera converti en majuscules. Ex: "basic" → "BASIC"</p>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Prix mensuel (XAF)</label>
                    <input type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })} placeholder="Ex: 15000, 25000, 50000..."
                      className={cn('w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border', inputCls)} />
                  </div>
                  <div>
                    <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Prix annuel (XAF)</label>
                    <input type="number" value={form.yearlyPrice} onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })} placeholder="Ex: 150000, 300000, 500000..."
                      className={cn('w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border', inputCls)} />
                  </div>
                </div>

                {/* Max hotspots + Description */}
                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Hotspots max</label>
                  <input type="number" value={form.maxHotspots} onChange={(e) => {
                    setForm({ ...form, maxHotspots: e.target.value })
                    setAdv('maxHotspots', Number(e.target.value) || 1)
                  }} placeholder="Ex: 1, 3, 5, 10..."
                    className={cn('w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border', inputCls)} />
                  <p className={cn('text-[10px] mt-1', textMuted)}>Nombre maximal de hotspots que l'abonné peut créer</p>
                </div>
                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Ex: Pour les petits commerces, Solution idéale pour les entreprises..."
                    className={cn('w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border resize-none', inputCls)} />
                </div>

                {/* Toggle populaire */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500" />
                  <span className={cn('text-xs font-medium', textPrimary)}>Marquer comme populaire</span>
                </label>

                {/* ── Avantages / Features ──────────────────────────── */}
                <div className={cn('rounded-xl border overflow-hidden', isLight ? 'border-slate-200' : 'border-slate-700/50')}>
                  <button onClick={() => setShowAdvEditor(!showAdvEditor)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 transition-colors cursor-pointer',
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30',
                    )}>
                    <span className={cn('text-xs font-semibold', textPrimary)}>Avantages & fonctionnalités</span>
                    <ChevronDown className={cn('w-4 h-4 transition-transform', showAdvEditor && 'rotate-180', textMuted)} />
                  </button>

                  <AnimatePresence>
                    {showAdvEditor && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className={cn('px-4 py-3 space-y-4 border-t', isLight ? 'border-slate-200' : 'border-slate-700/50')}>
                          {/* Numeric limits */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={cn('block text-[10px] font-medium mb-1', textSecondary)}>Tickets / mois</label>
                              <input type="number" value={form.advantages.monthlyTickets}
                                onChange={(e) => setAdv('monthlyTickets', Number(e.target.value) || 0)}
                                placeholder="Ex: 100, 500, 1000..."
                                className={cn('w-full px-3 py-2 rounded-lg text-xs font-medium outline-none transition-all border', inputCls)} />
                              <p className={cn('text-[9px] mt-0.5', textMuted)}>Tickets de connexion générés par mois. 0 = illimité</p>
                            </div>
                            <div>
                              <label className={cn('block text-[10px] font-medium mb-1', textSecondary)}>Forfaits / hotspot</label>
                              <input type="number" value={form.advantages.plansPerHotspot}
                                onChange={(e) => setAdv('plansPerHotspot', Number(e.target.value) || 0)}
                                placeholder="Ex: 5, 10, 20..."
                                className={cn('w-full px-3 py-2 rounded-lg text-xs font-medium outline-none transition-all border', inputCls)} />
                              <p className={cn('text-[9px] mt-0.5', textMuted)}>Forfaits WiFi créés par hotspot. 0 = illimité</p>
                            </div>
                          </div>

                          {/* API Access */}
                          <div>
                            <label className={cn('block text-[10px] font-medium mb-1', textSecondary)}>Accès API</label>
                            <div className="flex gap-2">
                              {API_ACCESS_OPTIONS.map((opt) => (
                                <button key={opt.value} onClick={() => setAdv('apiAccess', opt.value)}
                                  className={cn(
                                    'flex-1 py-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer',
                                    form.advantages.apiAccess === opt.value
                                      ? 'bg-blue-500 text-white border-blue-500'
                                      : isLight
                                        ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700',
                                  )}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Toggle features */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {FEATURES_DEF.map((feat) => (
                              <label key={feat.key}
                                className={cn(
                                  'flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all cursor-pointer',
                                  form.advantages[feat.key]
                                    ? isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/5 border-blue-500/20'
                                    : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/30 border-slate-700/50',
                                )}>
                                <div className={cn(
                                  'w-4 h-4 rounded flex items-center justify-center transition-all',
                                  form.advantages[feat.key]
                                    ? 'bg-blue-500 text-white'
                                    : isLight ? 'bg-slate-200' : 'bg-slate-700',
                                )}>
                                  {form.advantages[feat.key] && <Check className="w-3 h-3" />}
                                </div>
                                <span className={cn('text-xs', textPrimary)}>{feat.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className={cn('px-6 py-4 border-t', isLight ? 'border-slate-200' : 'border-slate-800')}>
                <button onClick={handleSave} disabled={actioning}
                  className={cn('w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50', isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')}>
                  {actioning ? 'Enregistrement...' : editingPlan ? 'Modifier le plan' : 'Créer le plan'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Supprimer le plan" message="Cette action est irréversible." confirmLabel="Supprimer" />
    </div>
  )
}
