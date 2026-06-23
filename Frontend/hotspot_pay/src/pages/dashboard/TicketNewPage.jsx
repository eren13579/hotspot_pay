import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useSelector } from 'react-redux'
import {
  Plus, Upload, FileUp, Lock, Wifi, AlertCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ticketsApi, hotspotsApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { usePlan } from '../../hooks/usePlan'
import { cn } from '../../utils/cn'
import HotspotSelector from '../../components/ui/HotspotSelector'
import {
  TicketNewHeader, BulkImportArea, TicketFormRow, TicketFormHeader,
} from '../../components/tickets'

export default function TicketNewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const theme = useSelector((state) => state.ui.theme)
  const { user, role } = useAuth()
  const { isProOrAbove } = usePlan()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const canBulkImport = isAdmin || isProOrAbove
  const uid = user?.userId || ''

  const preselectedHotspotId = searchParams.get('hotspotId') || ''

  const [hotspots, setHotspots] = useState([])
  const [loadingHotspots, setLoadingHotspots] = useState(true)
  const [selectedHotspotId, setSelectedHotspotId] = useState(preselectedHotspotId)

  const [submitting, setSubmitting] = useState(false)

  // Lignes de tickets (form mode)
  const [ticketRows, setTicketRows] = useState([
    { username: '', password: '', profile: 'default', timeLimit: '', dataLimit: '', comment: '' },
  ])

  // Bulk mode
  const [showBulk, setShowBulk] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkFormat, setBulkFormat] = useState('csv')
  const [dragOver, setDragOver] = useState(false)

  const isLight = theme === 'light'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  const inputBase = cn(
    'w-full h-12 px-4 text-sm outline-none transition-all duration-200 rounded-xl',
    isLight
      ? 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
      : 'bg-slate-800/60 border border-slate-700/60 text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15',
  )

  const containerCls = isLight
    ? 'bg-white border border-slate-200 shadow-sm'
    : 'bg-slate-900/50 border border-slate-800 shadow-xl shadow-black/10'

  // ── HotspotList ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
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
    }
    fetch()
    return () => { cancelled = true }
  }, [uid, isAdmin, preselectedHotspotId])

  // ── Helpers ─────────────────────────────────────────────────────────
  const addRow = () => setTicketRows((prev) => [
    ...prev,
    { username: '', password: '', profile: 'default', timeLimit: '', dataLimit: '', comment: '' },
  ])

  const removeRow = (index) => {
    if (ticketRows.length === 1) return
    setTicketRows((prev) => prev.filter((_, i) => i !== index))
  }

  const updateRow = (index, field, value) => {
    setTicketRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  // ── CSV file upload ────────────────────────────────────────────────
  const handleFileUpload = (file) => {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      setBulkText((prev) => (prev ? `${prev}\n${text}` : text))
      setBulkFormat('csv')
      toast.success(`Fichier "${file.name}" chargé (${text.split('\n').length} lignes)`)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFileUpload(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  // ── Parser ──────────────────────────────────────────────────────────
  const parseBulk = () => {
    const lines = bulkText.trim().split('\n').filter(Boolean)
    const tickets = []

    if (bulkFormat === 'csv') {
      for (const line of lines) {
        const parts = line.split(',').map((s) => s.trim())
        if (parts.length < 2) continue
        const [username, password, profile, timeLimit, dataLimit, comment] = parts
        tickets.push({
          username: username || '',
          password: password || '',
          profile: profile || 'default',
          timeLimit: timeLimit || '',
          dataLimit: dataLimit || '',
          comment: comment || '',
        })
      }
    } else {
      for (const line of lines) {
        const parts = line.split(/[=:]/).map((s) => s.trim())
        if (parts.length < 2) continue
        tickets.push({
          username: parts[0],
          password: parts[1],
          profile: 'default',
          timeLimit: '',
          dataLimit: '',
          comment: '',
        })
      }
    }
    return tickets
  }

  // ── Soumission ──────────────────────────────────────────────────────
  const validate = () => {
    if (!selectedHotspotId) {
      toast.error('Veuillez sélectionner un hotspot')
      return false
    }
    if (showBulk) {
      if (!bulkText.trim()) {
        toast.error('Ajoutez des tickets ou importez un fichier CSV')
        return false
      }
    } else {
      const valid = ticketRows.filter((r) => r.username.trim() && r.password.trim())
      if (valid.length === 0) {
        toast.error('Ajoutez au moins un ticket avec username et mot de passe')
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)

    const payload = showBulk
      ? parseBulk()
      : ticketRows.filter((r) => r.username.trim() && r.password.trim())

    if (payload.length === 0) {
      toast.error('Aucun ticket valide à importer')
      setSubmitting(false)
      return
    }

    const tickets = payload.map((t) => ({
      username: t.username.trim(),
      password: t.password.trim(),
      profile: t.profile || 'default',
      timeLimit: t.timeLimit || undefined,
      dataLimit: t.dataLimit ? parseInt(t.dataLimit, 10) || undefined : undefined,
      comment: t.comment || undefined,
    }))

    const cleanTickets = tickets.map((t) =>
      Object.fromEntries(Object.entries(t).filter(([, v]) => v !== undefined))
    )

    try {
      const res = await ticketsApi.import(selectedHotspotId, cleanTickets)
      if (res?.data?.success) {
        toast.success(`${cleanTickets.length} ticket${cleanTickets.length > 1 ? 's' : ''} importé${cleanTickets.length > 1 ? 's' : ''} avec succès`)
        navigate(`/dashboard/tickets?hotspotId=${selectedHotspotId}`)
      } else {
        toast.error(res?.data?.message || "Échec de l'import")
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Erreur lors de l'import"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBack = () => navigate(`/dashboard/tickets${selectedHotspotId ? `?hotspotId=${selectedHotspotId}` : ''}`)

  // ── Loading ──────────────────────────────────────────────────────────
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

  // ── Pas de hotspot ──────────────────────────────────────────────────
  if (!loadingHotspots && hotspots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className={cn('w-20 h-20 rounded-3xl flex items-center justify-center mb-6',
          isLight ? 'bg-blue-50' : 'bg-blue-500/10')}>
          <Wifi className={cn('w-10 h-10', isLight ? 'text-blue-500' : 'text-blue-400')} />
        </div>
        <h2 className={cn('text-2xl font-bold mb-3', textPrimary)}>Aucun hotspot</h2>
        <p className={cn('text-sm mb-8 max-w-md', textSecondary)}>
          Créez d'abord un hotspot pour pouvoir importer des tickets WiFi.
        </p>
        <button
          onClick={() => navigate('/dashboard/hotspots/new')}
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-linear-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          Créer un hotspot
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Halos d'ambiance */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <TicketNewHeader
        isLight={isLight}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        selectedHotspotId={selectedHotspotId}
        onBack={handleBack}
      />

      {/* Formulaire */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('rounded-2xl p-6 sm:p-8 relative overflow-hidden space-y-8', containerCls)}
      >
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/2 rounded-full blur-[80px] pointer-events-none" />

        {/* Sélecteur hotspot */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-0.5 h-4 rounded-full bg-blue-500" />
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
        </div>

        {/* Mode bulk */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-0.5 h-4 rounded-full bg-emerald-500" />
            <h3 className={cn('text-[11px] font-bold uppercase tracking-widest', textPrimary)}>
              Tickets
            </h3>
          </div>

          {canBulkImport ? (
            <div className={cn(
              'flex items-center gap-3 p-3 rounded-xl border mb-4',
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/20 border-slate-700/50',
            )}>
              <div className="flex items-center gap-2 flex-1">
                <FileUp className={cn('w-4 h-4', isLight ? 'text-slate-500' : 'text-slate-400')} />
                <span className={cn('text-xs font-medium', textPrimary)}>Import en masse</span>
                <span className={cn('text-[10px]', textMuted)}>(CSV ou user=pass)</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBulk}
                  onChange={(e) => setShowBulk(e.target.checked)}
                  className="accent-blue-600 w-4 h-4"
                />
                <span className={cn('text-[11px] font-medium', textSecondary)}>Activer</span>
              </label>
            </div>
          ) : (
            <div className={cn(
              'flex items-center gap-3 p-3 rounded-xl border mb-4 opacity-60',
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/20 border-slate-700/50',
            )}>
              <div className="flex items-center gap-2 flex-1">
                <Lock className={cn('w-4 h-4', textMuted)} />
                <span className={cn('text-xs font-medium', textPrimary)}>Import en masse</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">PRO</span>
              </div>
              <span className={cn('text-[10px]', textMuted)}>Ajout individuel uniquement</span>
            </div>
          )}

          {showBulk ? (
            /* ══════════════ MODE BULK ═════════════════════════════ */
            <BulkImportArea
              isLight={isLight}
              bulkText={bulkText}
              setBulkText={setBulkText}
              bulkFormat={bulkFormat}
              setBulkFormat={setBulkFormat}
              onFileUpload={handleFileUpload}
              dragOver={dragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              parsedCount={parseBulk().length}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              textMuted={textMuted}
            />
          ) : (
            /* ══════════════ MODE FORMULAIRE ════════════════════════ */
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-500 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter une ligne
                </button>
              </div>

              <TicketFormHeader textMuted={textMuted} />

              {ticketRows.map((row, i) => (
                <TicketFormRow
                  key={i}
                  row={row}
                  index={i}
                  isLight={isLight}
                  onUpdate={updateRow}
                  onRemove={removeRow}
                  canRemove={ticketRows.length > 1}
                  inputBase={inputBase}
                />
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div className={cn(
          'flex items-start gap-3 p-4 rounded-xl border text-xs leading-relaxed',
          isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-500/5 border-amber-800/30 text-amber-300',
        )}>
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <strong className="font-semibold">Format de durée :</strong>{' '}
            Utilisez le format MikroTik : <code className="font-mono">1h</code> pour 1 heure,{' '}
            <code className="font-mono">30m</code> pour 30 minutes,{' '}
            <code className="font-mono">1d</code> pour 1 jour.
            <br />
            <strong className="font-semibold">Limite data :</strong>{' '}
            Saisissez la valeur en <strong>méga-octets (MB)</strong>.
            <br />
            Les champs <strong>username</strong> et <strong>mot de passe</strong> sont requis.
          </div>
        </div>

        {/* Submit */}
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
            className="flex items-center gap-2 h-11 px-6 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importation…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importer{' '}
                {showBulk && bulkText.trim()
                  ? `(${parseBulk().length})`
                  : ticketRows.filter(r => r.username.trim() && r.password.trim()).length > 0
                    ? `(${ticketRows.filter(r => r.username.trim() && r.password.trim()).length})`
                    : ''}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
