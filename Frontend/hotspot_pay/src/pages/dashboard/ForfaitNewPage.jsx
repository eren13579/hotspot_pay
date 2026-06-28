import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useSelector } from 'react-redux'
import {
  Tag, Plus, Wifi, Clock, Database, ArrowLeft,
  Download, Upload, Check, RefreshCw, Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { hotspotPlansApi, hotspotsApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { formatXAF } from '../../utils/format'
import { cn } from '../../utils/cn'
import HotspotSelector from '../../components/ui/HotspotSelector'

function formatDuration(min) {
  if (!min && min !== 0) return ''
  if (min < 60) return `${min} min`
  if (min < 1440) return `${Math.floor(min / 60)}h${min % 60 ? min % 60 + 'min' : ''}`
  const jours = Math.floor(min / 1440)
  return `${jours}j`
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

export default function ForfaitNewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const theme = useSelector((state) => state.ui.theme)
  const { user, role } = useAuth()
  const isLight = theme === 'light'
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const uid = user?.userId || ''

  const preselectedHotspotId = searchParams.get('hotspotId') || ''

  // Hotspots
  const [hotspots, setHotspots] = useState([])
  const [loadingHotspots, setLoadingHotspots] = useState(true)
  const [selectedHotspotId, setSelectedHotspotId] = useState(preselectedHotspotId)

  // Form
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  const inputBase = cn(
    'w-full h-12 px-4 text-sm outline-none transition-all duration-200 rounded-xl',
    isLight
      ? 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20'
      : 'bg-slate-800/60 border border-slate-700/60 text-white placeholder:text-slate-500 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15',
  )

  const inputError = cn(
    'w-full h-12 px-4 text-sm outline-none rounded-xl border border-red-500/50 bg-red-500/5 text-red-400',
  )

  const containerCls = isLight
    ? 'bg-white border border-slate-200 shadow-sm'
    : 'bg-slate-900/50 border border-slate-800 shadow-xl shadow-black/10'

  // ── Charger les hotspots ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingHotspots(true)
        const res = await (isAdmin
          ? hotspotsApi.adminList(0, 100)
          : hotspotsApi.list(uid, 0, 100))
        if (cancelled) return
        const list = res?.data?.data?.content || res?.data?.data || []
        setHotspots(Array.isArray(list) ? list : [])
        if (!preselectedHotspotId && Array.isArray(list) && list.length === 1) {
          setSelectedHotspotId(list[0].hotspot_id || list[0].id)
        }
      } catch {
        if (cancelled) return
        toast.error('Erreur lors du chargement des hotspots')
      } finally {
        if (!cancelled) setLoadingHotspots(false)
      }
    })()
    return () => { cancelled = true }
  }, [uid, isAdmin, preselectedHotspotId])

  // ── Validation ─────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!selectedHotspotId) errs.hotspot = 'Sélectionnez un hotspot'
    if (!form.name.trim()) errs.name = 'Le nom est obligatoire'
    if (!form.durationMinutes || form.durationMinutes < 1) errs.durationMinutes = 'Durée minimum 1 minute'
    if (!form.price || parseFloat(form.price) <= 0) errs.price = 'Le prix doit être supérieur à 0'
    if (form.downloadSpeedKbps && parseInt(form.downloadSpeedKbps) < 64) errs.downloadSpeedKbps = 'Minimum 64 Kbps'
    if (form.uploadSpeedKbps && parseInt(form.uploadSpeedKbps) < 64) errs.uploadSpeedKbps = 'Minimum 64 Kbps'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Soumission ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        durationMinutes: parseInt(form.durationMinutes),
        price: parseFloat(form.price),
        currency: form.currency || 'XAF',
        downloadSpeedKbps: form.downloadSpeedKbps ? parseInt(form.downloadSpeedKbps) : undefined,
        uploadSpeedKbps: form.uploadSpeedKbps ? parseInt(form.uploadSpeedKbps) : undefined,
        dataLimitMb: form.dataLimitMb ? parseInt(form.dataLimitMb) : undefined,
      }
      const { data: res } = await hotspotPlansApi.create(selectedHotspotId, payload)
      if (res?.success) {
        toast.success('Forfait créé avec succès')
        navigate(`/dashboard/forfaits?hotspotId=${selectedHotspotId}`)
      } else {
        toast.error(res?.message || 'Échec de la création')
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleBack = () => navigate(`/dashboard/forfaits${selectedHotspotId ? `?hotspotId=${selectedHotspotId}` : ''}`)

  // ── Loading ────────────────────────────────────────────────────────
  if (loadingHotspots) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-800" />
          <div className="space-y-2">
            <div className="h-6 w-56 bg-slate-800 rounded-lg" />
            <div className="h-4 w-40 bg-slate-800 rounded-lg" />
          </div>
        </div>
        <div className={cn('rounded-2xl overflow-hidden', containerCls)}>
          <div className="p-6 space-y-5">
            <div className="h-12 bg-slate-800 rounded-xl" />
            <div className="h-12 bg-slate-800 rounded-xl" />
            <div className="h-32 bg-slate-800 rounded-xl" />
            <div className="h-10 w-40 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // ── Pas de hotspot ─────────────────────────────────────────────────
  if (!loadingHotspots && hotspots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className={cn('w-20 h-20 rounded-3xl flex items-center justify-center mb-6',
          isLight ? 'bg-amber-50' : 'bg-amber-500/10')}>
          <Wifi className={cn('w-10 h-10', isLight ? 'text-amber-500' : 'text-amber-400')} />
        </div>
        <h2 className={cn('text-2xl font-bold mb-3', textPrimary)}>Aucun hotspot</h2>
        <p className={cn('text-sm mb-8 max-w-md', textSecondary)}>
          Créez d'abord un hotspot pour pouvoir créer des forfaits WiFi.
        </p>
        <button
          onClick={() => navigate('/dashboard/hotspots/new')}
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-linear-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          Créer un hotspot
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Halos */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header (comme TicketNewHeader) */}
      <div className="flex items-center gap-4 relative">
        <button
          onClick={handleBack}
          className={cn(
            'p-2.5 rounded-xl transition-all shrink-0',
            isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400',
            'hover:scale-105 active:scale-95',
          )}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center',
            isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400',
          )}>
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h1 className={cn('text-2xl font-black tracking-tight', textPrimary)}>Nouveau forfait</h1>
            <p className={cn('text-sm mt-0.5', textSecondary)}>
              Créez un forfait WiFi pour vos clients hotspot
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('rounded-2xl p-6 sm:p-8 relative overflow-hidden space-y-8', containerCls)}
      >
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/2 rounded-full blur-[80px] pointer-events-none" />

        {/* Hotspot cible */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-0.5 h-4 rounded-full bg-amber-500" />
            <h3 className={cn('text-[11px] font-bold uppercase tracking-widest', textPrimary)}>
              Hotspot cible
            </h3>
          </div>
          <HotspotSelector
            hotspots={hotspots}
            selectedId={selectedHotspotId}
            onSelect={setSelectedHotspotId}
            isLight={isLight}
          />
          {errors.hotspot && <p className="text-[11px] text-red-400 mt-1.5">{errors.hotspot}</p>}
        </div>

        {/* Détails du forfait */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-0.5 h-4 rounded-full bg-amber-500" />
            <h3 className={cn('text-[11px] font-bold uppercase tracking-widest', textPrimary)}>
              Détails du forfait
            </h3>
          </div>

          <div className="space-y-4">
            {/* Nom */}
            <div>
              <label className={cn('text-xs font-semibold mb-1.5 block', isLight ? 'text-slate-700' : 'text-slate-300')}>
                Nom du forfait <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Ex: 1 Heure WiFi, 500 MB Data, Journée illimitée..."
                className={errors.name ? inputError : inputBase}
              />
              {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
              <p className={cn('text-[10px] mt-1 flex items-center gap-1', textMuted)}>
                <Tag className="w-3 h-3" /> Ce nom sera affiché aux clients sur le portail captif
              </p>
            </div>

            {/* Description */}
            <div>
              <label className={cn('text-xs font-semibold mb-1.5 block', isLight ? 'text-slate-700' : 'text-slate-300')}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={set('description')}
                placeholder="Ex: Accès Internet haut débit valable 24h, Navigation illimitée pendant 1 heure..."
                rows={2}
                className={cn(inputBase, 'resize-none h-full min-h-[48px] py-3')}
              />
            </div>

            {/* Durée + Prix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={cn('text-xs font-semibold mb-1.5 block', isLight ? 'text-slate-700' : 'text-slate-300')}>
                  Durée <span className="text-red-400">*</span>
                  <span className={cn('text-[10px] font-normal ml-1', textMuted)}>(en minutes)</span>
                </label>
                <div className="relative">
                  <Clock className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isLight ? 'text-slate-400' : 'text-slate-500')} />
                  <input
                    type="number"
                    min="1"
                    max="44640"
                    value={form.durationMinutes}
                    onChange={set('durationMinutes')}
                    placeholder="Ex: 60, 1440, 10080..."
                    className={cn(errors.durationMinutes ? inputError : inputBase, 'pl-10')}
                  />
                </div>
                {errors.durationMinutes && <p className="text-[11px] text-red-400 mt-1">{errors.durationMinutes}</p>}
                {form.durationMinutes > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDuration(parseInt(form.durationMinutes))}
                  </p>
                )}
                <div className={cn('flex flex-wrap gap-2 mt-2', isLight ? 'text-slate-400' : 'text-slate-500')}>
                  {[
                    { min: 30, label: '30min' },
                    { min: 60, label: '1h' },
                    { min: 360, label: '6h' },
                    { min: 1440, label: '24h' },
                    { min: 10080, label: '7j' },
                    { min: 43200, label: '30j' },
                  ].map(({ min, label }) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, durationMinutes: min }))}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border',
                        form.durationMinutes === min
                          ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                          : isLight
                            ? 'border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600'
                            : 'border-slate-700/50 hover:border-slate-600 text-slate-500 hover:text-slate-300',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={cn('text-xs font-semibold mb-1.5 block', isLight ? 'text-slate-700' : 'text-slate-300')}>
                  Prix <span className="text-red-400">*</span>
                  <span className={cn('text-[10px] font-normal ml-1', textMuted)}>(en FCFA)</span>
                </label>
                <div className="relative">
                  <span className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold', isLight ? 'text-slate-400' : 'text-slate-500')}>F</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={set('price')}
                    placeholder="Ex: 500, 1000, 2000..."
                    className={cn(errors.price ? inputError : inputBase, 'pl-8')}
                  />
                </div>
                {errors.price && <p className="text-[11px] text-red-400 mt-1">{errors.price}</p>}
                {form.price > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> {formatXAF(parseFloat(form.price))}
                  </p>
                )}
                <div className={cn('flex flex-wrap gap-2 mt-2', isLight ? 'text-slate-400' : 'text-slate-500')}>
                  {[500, 1000, 1500, 2000, 5000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, price: String(val) }))}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer border',
                        String(form.price) === String(val)
                          ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                          : isLight
                            ? 'border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600'
                            : 'border-slate-700/50 hover:border-slate-600 text-slate-500 hover:text-slate-300',
                      )}
                    >
                      {formatXAF(val)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Devise */}
            <div>
              <label className={cn('text-xs font-semibold mb-1.5 block', isLight ? 'text-slate-700' : 'text-slate-300')}>Devise</label>
              <select
                value={form.currency}
                onChange={set('currency')}
                className={inputBase}
              >
                <option value="XAF">XAF (Franc CFA)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (Dollar US)</option>
              </select>
            </div>

            {/* Limites */}
            <div>
              <p className={cn('text-xs font-semibold mb-3', isLight ? 'text-slate-700' : 'text-slate-300')}>
                Limites <span className={cn('text-[11px] font-normal', textMuted)}>(laisser vide = illimité)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={cn('text-[11px] mb-1 flex items-center gap-1.5', isLight ? 'text-slate-500' : 'text-slate-400')}>
                    <Database className="w-3.5 h-3.5" /> Data <span className={textMuted}>(MB)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.dataLimitMb}
                    onChange={set('dataLimitMb')}
                    placeholder="Illimité (ex: 500, 1024)"
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className={cn('text-[11px] mb-1 flex items-center gap-1.5', isLight ? 'text-slate-500' : 'text-slate-400')}>
                    <Download className="w-3.5 h-3.5" /> Download <span className={textMuted}>(Kbps)</span>
                  </label>
                  <input
                    type="number"
                    min="64"
                    value={form.downloadSpeedKbps}
                    onChange={set('downloadSpeedKbps')}
                    placeholder="Ex: 512, 1024, 2048..."
                    className={errors.downloadSpeedKbps ? inputError : inputBase}
                  />
                  {form.downloadSpeedKbps > 0 && (
                    <p className={cn('text-[10px] mt-0.5', textMuted)}>
                      ≈ {Math.round(parseInt(form.downloadSpeedKbps) / 1000 * 10) / 10} Mbps
                    </p>
                  )}
                  <div className={cn('flex flex-wrap gap-1.5 mt-1.5')}>
                    {[
                      { val: 512, label: '512 Kbps' },
                      { val: 1024, label: '1 Mbps' },
                      { val: 2048, label: '2 Mbps' },
                      { val: 5120, label: '5 Mbps' },
                      { val: 10240, label: '10 Mbps' },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, downloadSpeedKbps: String(val) }))}
                        className={cn(
                          'px-2 py-0.5 rounded text-[9px] font-medium transition-all cursor-pointer border',
                          String(form.downloadSpeedKbps) === String(val)
                            ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                            : isLight
                              ? 'border-slate-200 hover:border-slate-300 text-slate-400'
                              : 'border-slate-700/50 hover:border-slate-600 text-slate-500',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={cn('text-[11px] mb-1 flex items-center gap-1.5', isLight ? 'text-slate-500' : 'text-slate-400')}>
                    <Upload className="w-3.5 h-3.5" /> Upload <span className={textMuted}>(Kbps)</span>
                  </label>
                  <input
                    type="number"
                    min="64"
                    value={form.uploadSpeedKbps}
                    onChange={set('uploadSpeedKbps')}
                    placeholder="Ex: 256, 512, 1024..."
                    className={errors.uploadSpeedKbps ? inputError : inputBase}
                  />
                  {form.uploadSpeedKbps > 0 && (
                    <p className={cn('text-[10px] mt-0.5', textMuted)}>
                      ≈ {Math.round(parseInt(form.uploadSpeedKbps) / 1000 * 10) / 10} Mbps
                    </p>
                  )}
                  <div className={cn('flex flex-wrap gap-1.5 mt-1.5')}>
                    {[
                      { val: 256, label: '256 Kbps' },
                      { val: 512, label: '512 Kbps' },
                      { val: 1024, label: '1 Mbps' },
                      { val: 2048, label: '2 Mbps' },
                      { val: 5120, label: '5 Mbps' },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, uploadSpeedKbps: String(val) }))}
                        className={cn(
                          'px-2 py-0.5 rounded text-[9px] font-medium transition-all cursor-pointer border',
                          String(form.uploadSpeedKbps) === String(val)
                            ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                            : isLight
                              ? 'border-slate-200 hover:border-slate-300 text-slate-400'
                              : 'border-slate-700/50 hover:border-slate-600 text-slate-500',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/50">
          <button
            onClick={handleBack}
            className={cn(
              'h-11 px-5 rounded-xl text-xs font-semibold transition-all',
              isLight ? 'text-slate-600 hover:bg-slate-100 border border-slate-200' : 'text-slate-400 hover:bg-slate-800 border border-slate-700/50',
            )}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedHotspotId}
            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Création…</>
            ) : (
              <><Check className="w-4 h-4" /> Créer le forfait</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
