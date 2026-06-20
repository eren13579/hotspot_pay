/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tag, Wifi, Zap, Clock, Database,
  Download, Upload, Edit3, Trash2, ToggleLeft, ToggleRight,
  X, Check, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { hotspotPlansApi } from '../../api/endpoints'
import { formatXAF } from '../../utils/format'
import { cn } from '../../utils/cn'

/* ── Helpers ─────────────────────────────────────────────────────── */

/** Extrait l'ID du forfait (snake_case FastAPI ou camelCase Java) */
function getPlanId(plan) {
  return plan?.plan_id || plan?.planId || plan?.id
}

function formatDuration(min) {
  if (!min && min !== 0) return ''
  if (min < 60) return `${min} min`
  if (min < 1440) return `${Math.floor(min / 60)}h${min % 60 ? min % 60 + 'min' : ''}`
  const jours = Math.floor(min / 1440)
  return `${jours}j`
}

function formatData(mb) {
  if (!mb && mb !== 0) return 'Illimité'
  return mb < 1024 ? `${mb} MB` : `${(mb / 1024).toFixed(1)} Go`
}

function formatSpeed(kbps) {
  if (!kbps) return '—'
  return kbps >= 1000 ? `${(kbps / 1000).toFixed(1)} Mbps` : `${kbps} Kbps`
}

const defaultForm = {
  name: '',
  description: '',
  durationMinutes: 60,
  price: '',
  currency: 'XAF',
  downloadSpeedKbps: '',
  uploadSpeedKbps: '',
  dataLimitMb: '',
}

/* ── PlanFormModal ────────────────────────────────────────────────── */

function PlanFormModal({ open, onClose, onSave, editingPlan, saving, isLight }) {
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      if (editingPlan) {
        setForm({
          name: editingPlan.name || '',
          description: editingPlan.description || '',
          durationMinutes: editingPlan.durationMinutes || 60,
          price: editingPlan.price?.toString() || '',
          currency: editingPlan.currency || 'XAF',
          downloadSpeedKbps: editingPlan.downloadSpeedKbps?.toString() || '',
          uploadSpeedKbps: editingPlan.uploadSpeedKbps?.toString() || '',
          dataLimitMb: editingPlan.dataLimitMb?.toString() || '',
        })
      } else {
        setForm(defaultForm)
      }
      setErrors({})
    }
  }, [open, editingPlan])

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Le nom est obligatoire'
    if (!form.durationMinutes || form.durationMinutes < 1) errs.durationMinutes = 'Durée minimum 1 minute'
    if (!form.price || parseFloat(form.price) <= 0) errs.price = 'Le prix doit être supérieur à 0'
    if (form.downloadSpeedKbps && parseInt(form.downloadSpeedKbps) < 64) errs.downloadSpeedKbps = 'Minimum 64 Kbps'
    if (form.uploadSpeedKbps && parseInt(form.uploadSpeedKbps) < 64) errs.uploadSpeedKbps = 'Minimum 64 Kbps'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      durationMinutes: parseInt(form.durationMinutes),
      price: parseFloat(form.price),
      currency: form.currency || 'XAF',
      downloadSpeedKbps: form.downloadSpeedKbps ? parseInt(form.downloadSpeedKbps) : undefined,
      uploadSpeedKbps: form.uploadSpeedKbps ? parseInt(form.uploadSpeedKbps) : undefined,
      dataLimitMb: form.dataLimitMb ? parseInt(form.dataLimitMb) : undefined,
    })
  }

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
        className={cn(
          'relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden',
          isLight ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800',
        )}
      >
        <div className={cn('flex items-center gap-3 px-6 pt-5 pb-3 border-b', isLight ? 'border-slate-100' : 'border-slate-800')}>
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isLight ? 'bg-amber-50' : 'bg-amber-500/10')}>
            <Tag className={cn('w-4.5 h-4.5', isLight ? 'text-amber-600' : 'text-amber-400')} />
          </div>
          <div className="flex-1">
            <h2 className={cn('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>
              {editingPlan ? 'Modifier le forfait' : 'Nouveau forfait'}
            </h2>
            <p className={cn('text-[10px]', isLight ? 'text-slate-400' : 'text-slate-500')}>
              {editingPlan ? 'Modifiez les caractéristiques du forfait' : 'Créez un nouveau forfait WiFi'}
            </p>
          </div>
          <button onClick={onClose} className={cn('p-1.5 rounded-lg transition-colors', isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-800 text-slate-500')}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Nom */}
          <div>
            <label className={cn('text-[11px] font-semibold mb-1.5 block', isLight ? 'text-slate-700' : 'text-slate-300')}>
              Nom du forfait <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="Ex: 1 Heure, 500 MB, Journée..."
              className={cn(
                'w-full h-10 px-3.5 rounded-xl text-xs outline-none transition-colors',
                errors.name
                  ? 'border border-red-500/50 bg-red-500/5 text-red-400'
                  : isLight
                    ? 'border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                    : 'border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/50',
              )}
            />
            {errors.name && <p className="text-[10px] text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className={cn('text-[11px] font-semibold mb-1.5 block', isLight ? 'text-slate-700' : 'text-slate-300')}>Description</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Description optionnelle du forfait..."
              rows={2}
              className={cn(
                'w-full px-3.5 py-2.5 rounded-xl text-xs outline-none resize-none transition-colors',
                isLight
                  ? 'border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                  : 'border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/50',
              )}
            />
          </div>

          {/* Durée + Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={cn('text-[11px] font-semibold mb-1.5 block', isLight ? 'text-slate-700' : 'text-slate-300')}>
                Durée (minutes) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Clock className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5', isLight ? 'text-slate-400' : 'text-slate-500')} />
                <input
                  type="number" min="1" max="44640"
                  value={form.durationMinutes}
                  onChange={set('durationMinutes')}
                  className={cn(
                    'w-full h-10 pl-9 pr-3 rounded-xl text-xs outline-none transition-colors',
                    errors.durationMinutes
                      ? 'border border-red-500/50 bg-red-500/5 text-red-400'
                      : isLight
                        ? 'border border-slate-200 bg-slate-50 text-slate-900 focus:border-amber-400'
                        : 'border border-slate-700 bg-slate-800/50 text-white focus:border-amber-500/50',
                  )}
                />
              </div>
              {errors.durationMinutes && <p className="text-[10px] text-red-400 mt-1">{errors.durationMinutes}</p>}
              {form.durationMinutes > 0 && (
                <p className="text-[10px] text-slate-500 mt-0.5">Soit {formatDuration(parseInt(form.durationMinutes))}</p>
              )}
            </div>
            <div>
              <label className={cn('text-[11px] font-semibold mb-1.5 block', isLight ? 'text-slate-700' : 'text-slate-300')}>
                Prix <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold', isLight ? 'text-slate-400' : 'text-slate-500')}>F</span>
                <input
                  type="number" min="0.01" step="0.01"
                  value={form.price}
                  onChange={set('price')}
                  placeholder="0"
                  className={cn(
                    'w-full h-10 pl-8 pr-3 rounded-xl text-xs outline-none transition-colors',
                    errors.price
                      ? 'border border-red-500/50 bg-red-500/5 text-red-400'
                      : isLight
                        ? 'border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                        : 'border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/50',
                  )}
                />
              </div>
              {errors.price && <p className="text-[10px] text-red-400 mt-1">{errors.price}</p>}
            </div>
          </div>

          {/* Devise */}
          <div>
            <label className={cn('text-[11px] font-semibold mb-1.5 block', isLight ? 'text-slate-700' : 'text-slate-300')}>Devise</label>
            <select
              value={form.currency}
              onChange={set('currency')}
              className={cn(
                'w-full h-10 px-3.5 rounded-xl text-xs outline-none transition-colors',
                isLight
                  ? 'border border-slate-200 bg-slate-50 text-slate-900 focus:border-amber-400'
                  : 'border border-slate-700 bg-slate-800/50 text-white focus:border-amber-500/50',
              )}
            >
              <option value="XAF">XAF (Franc CFA)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dollar US)</option>
            </select>
          </div>

          {/* Limites */}
          <div>
            <p className={cn('text-[11px] font-semibold mb-2', isLight ? 'text-slate-700' : 'text-slate-300')}>
              Limites <span className={cn('text-[10px] font-normal', isLight ? 'text-slate-400' : 'text-slate-500')}>(laisser vide = illimité)</span>
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className={cn('text-[10px] mb-1 flex items-center gap-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
                  <Database className="w-3 h-3" /> Data (MB)
                </label>
                <input
                  type="number" min="1"
                  value={form.dataLimitMb}
                  onChange={set('dataLimitMb')}
                  placeholder="Illimité"
                  className={cn(
                    'w-full h-9 px-3 rounded-lg text-xs outline-none transition-colors',
                    isLight
                      ? 'border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                      : 'border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/50',
                  )}
                />
              </div>
              <div>
                <label className={cn('text-[10px] mb-1 flex items-center gap-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
                  <Download className="w-3 h-3" /> Download
                </label>
                <input
                  type="number" min="64"
                  value={form.downloadSpeedKbps}
                  onChange={set('downloadSpeedKbps')}
                  placeholder="Kbps"
                  className={cn(
                    'w-full h-9 px-3 rounded-lg text-xs outline-none transition-colors',
                    errors.downloadSpeedKbps
                      ? 'border border-red-500/50 bg-red-500/5 text-red-400'
                      : isLight
                        ? 'border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                        : 'border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/50',
                  )}
                />
              </div>
              <div>
                <label className={cn('text-[10px] mb-1 flex items-center gap-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
                  <Upload className="w-3 h-3" /> Upload
                </label>
                <input
                  type="number" min="64"
                  value={form.uploadSpeedKbps}
                  onChange={set('uploadSpeedKbps')}
                  placeholder="Kbps"
                  className={cn(
                    'w-full h-9 px-3 rounded-lg text-xs outline-none transition-colors',
                    errors.uploadSpeedKbps
                      ? 'border border-red-500/50 bg-red-500/5 text-red-400'
                      : isLight
                        ? 'border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-amber-400'
                        : 'border border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-amber-500/50',
                  )}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button type="button" onClick={onClose}
              className={cn(
                'flex-1 h-10 rounded-xl text-xs font-semibold transition-all',
                isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
              )}
            >
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/25"
            >
              {saving ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> {editingPlan ? 'Modification...' : 'Création...'}</>
              ) : (
                <><Check className="w-3.5 h-3.5" /> {editingPlan ? 'Enregistrer' : 'Créer le forfait'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ── PlansTabContent ──────────────────────────────────────────────── */

export default function PlansTabContent({ hotspotId, data, isLight, onRefresh }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  useEffect(() => {
    const items = (() => {
      if (Array.isArray(data)) return data
      if (data?.plans) return data.plans
      return data?.items ?? data?.content ?? []
    })()
    setPlans(items)
    setLoading(false)
  }, [data])

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      if (editingPlan) {
        const { data: res } = await hotspotPlansApi.update(hotspotId, getPlanId(editingPlan), payload)
        if (res?.success) {
          toast.success('Forfait modifié avec succès')
          setShowForm(false); setEditingPlan(null)
          onRefresh?.()
        } else {
          toast.error(res?.message || 'Échec de la modification')
        }
      } else {
        const { data: res } = await hotspotPlansApi.create(hotspotId, payload)
        if (res?.success) {
          toast.success('Forfait créé avec succès')
          setShowForm(false)
          onRefresh?.()
        } else {
          toast.error(res?.message || 'Échec de la création')
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (plan) => {
    setTogglingId(getPlanId(plan))
    try {
      const { data: res } = await hotspotPlansApi.toggle(hotspotId, getPlanId(plan))
      if (res?.success) {
        setPlans((prev) => prev.map((p) =>
          getPlanId(p) === getPlanId(plan) ? { ...p, isActive: !p.isActive } : p,
        ))
        toast.success(`Forfait ${plan.isActive ? 'désactivé' : 'activé'}`)
      } else {
        toast.error(res?.message || 'Échec du changement de statut')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Erreur réseau')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { data: res } = await hotspotPlansApi.delete(hotspotId, getPlanId(deleteTarget))
      if (res?.success) {
        setPlans((prev) => prev.filter((p) => getPlanId(p) !== getPlanId(deleteTarget)))
        toast.success('Forfait supprimé')
        setDeleteTarget(null)
      } else {
        toast.error(res?.message || 'Échec de la suppression')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Erreur réseau')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn('h-16 rounded-xl', isLight ? 'bg-slate-100' : 'bg-slate-800')} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Compteur */}
      <div className="flex items-center justify-between mb-1">
        <p className={cn('text-[11px] font-medium', textMuted)}>
          {plans.length} forfait{plans.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Liste des forfaits */}
      {plans.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-3', isLight ? 'bg-slate-100' : 'bg-slate-800')}>
            <Tag className="w-7 h-7 text-slate-500" />
          </div>
          <p className={cn('text-sm font-semibold mb-1', isLight ? 'text-slate-700' : 'text-slate-300')}>Aucun forfait</p>
          <p className={cn('text-xs max-w-xs', textMuted)}>
            Créez votre premier forfait WiFi pour permettre aux clients de se connecter via le portail captif.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((plan, i) => (
            <motion.div
              key={getPlanId(plan) || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'flex items-stretch gap-0 rounded-xl border transition-all overflow-hidden',
                plan.isActive === false
                  ? isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-800/10 border-slate-700/30'
                  : isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-800/20 border-slate-700/50 hover:border-slate-600',
              )}
            >
              {/* Barre latérale statut */}
              <div className={cn(
                'w-1 shrink-0',
                plan.isActive === false
                  ? 'bg-slate-300'
                  : 'bg-emerald-500',
              )} />

              {/* Contenu principal */}
              <div className="flex-1 flex items-center gap-4 px-4 py-3.5 min-w-0">
                {/* Icône */}
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  plan.isActive === false
                    ? isLight ? 'bg-slate-100' : 'bg-slate-800'
                    : isLight ? 'bg-emerald-50' : 'bg-emerald-500/10',
                )}>
                  <Wifi className={cn(
                    'w-4.5 h-4.5',
                    plan.isActive === false
                      ? isLight ? 'text-slate-400' : 'text-slate-500'
                      : 'text-emerald-400',
                  )} />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className={cn('text-sm font-semibold truncate', isLight ? 'text-slate-900' : 'text-white')}>
                      {plan.name || 'Sans nom'}
                    </p>
                    <span className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold leading-none',
                      plan.isActive === false
                        ? isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-700 text-slate-400'
                        : 'bg-emerald-500/15 text-emerald-400',
                    )}>
                      {plan.isActive === false ? 'Inactif' : 'Actif'}
                    </span>
                  </div>
                  {plan.description && (
                    <p className={cn('text-[11px] mt-0.5 truncate', textMuted)}>{plan.description}</p>
                  )}

                  {/* Métriques */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={cn('flex items-center gap-1 text-xs font-bold', isLight ? 'text-amber-700' : 'text-amber-400')}>
                      <Zap className="w-3.5 h-3.5" />
                      {formatXAF(plan.price || 0)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatDuration(plan.durationMinutes)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Database className="w-3 h-3" />
                      {formatData(plan.dataLimitMb)}
                    </span>
                    {plan.downloadSpeedKbps && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Download className="w-3 h-3" />
                        {formatSpeed(plan.downloadSpeedKbps)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => handleToggle(plan)}
                    disabled={togglingId === getPlanId(plan)}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                      isLight
                        ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                        : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300',
                    )}
                    title={plan.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {togglingId === getPlanId(plan) ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : plan.isActive === false ? (
                      <ToggleRight className="w-3.5 h-3.5" />
                    ) : (
                      <ToggleLeft className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => { setEditingPlan(plan); setShowForm(true) }}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                      isLight ? 'text-blue-500 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-500/10',
                    )}
                    title="Modifier"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(plan)}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                      isLight ? 'text-red-400 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10',
                    )}
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal formulaire */}
      <AnimatePresence>
        {showForm && (
          <PlanFormModal
            open={showForm}
            onClose={() => { setShowForm(false); setEditingPlan(null) }}
            onSave={handleSave}
            editingPlan={editingPlan}
            saving={saving}
            isLight={isLight}
          />
        )}
      </AnimatePresence>

      {/* Confirmation suppression */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                'relative w-full max-w-sm rounded-2xl p-6 shadow-2xl',
                isLight ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800',
              )}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className={cn('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>Supprimer le forfait</h3>
                  <p className={cn('text-[11px]', isLight ? 'text-slate-500' : 'text-slate-400')}>
                    Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget.name}</strong> ?
                  </p>
                </div>
              </div>
              <p className={cn('text-[11px] mb-5', isLight ? 'text-slate-400' : 'text-slate-500')}>
                Cette action est irréversible. Les clients ne pourront plus acheter ce forfait sur le portail captif.
              </p>
              <div className="flex gap-2.5">
                <button onClick={() => setDeleteTarget(null)}
                  className={cn(
                    'flex-1 h-10 rounded-xl text-xs font-semibold transition-all',
                    isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
                  )}
                >
                  Annuler
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 h-10 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-400 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {deleting ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Suppression...</>
                  ) : (
                    <><Trash2 className="w-3.5 h-3.5" /> Supprimer</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
