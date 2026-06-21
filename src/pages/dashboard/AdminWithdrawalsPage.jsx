import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  Search, X, ShieldCheck, Clock, Wallet,
  TrendingUp, Users, RefreshCw, CheckCircle, DownloadCloud,
  CheckSquare, Square, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { withdrawalsApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'
import { formatXAF, timeAgo } from '../../utils/format'
import EmptyState, { LoadingSkeleton, ErrorState } from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/ui/ConfirmModal'

/* ─── Constantes ──────────────────────────────────────────── */
const STATUS_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'COMPLETED', label: 'Complétés' },
  { key: 'REJECTED', label: 'Rejetés' },
  { key: 'CANCELLED', label: 'Annulés' },
]

const PERIOD_FILTERS = [
  { key: '', label: 'Tout' },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '90d', label: '90 jours' },
]

const STATUS_STYLES = {
  PENDING:   { bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-400', label: 'En attente' },
  APPROVED:  { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',     dot: 'bg-blue-400',   label: 'Approuvé' },
  COMPLETED: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', label: 'Complété' },
  REJECTED:  { bg: 'bg-red-500/10 text-red-400 border-red-500/20',      dot: 'bg-red-400',    label: 'Rejeté' },
  CANCELLED: { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400',  label: 'Annulé' },
}

function getPeriodDate(key) {
  const d = new Date()
  switch (key) {
    case '7d': d.setDate(d.getDate() - 7); break
    case '30d': d.setDate(d.getDate() - 30); break
    case '90d': d.setDate(d.getDate() - 90); break
    default: return null
  }
  return d
}

/* ─── KPI Card ────────────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, color, isLight, subtitle }) {
  const colorMap = {
    amber:  isLight ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald:isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue:   isLight ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    rose:   isLight ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    red:    isLight ? 'bg-red-50 text-red-600 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-2xl border p-4 transition-all', isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/50 border-slate-800 shadow-lg shadow-black/10')}>
      <div className="flex items-start justify-between mb-2.5">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', colorMap[color] || colorMap.blue)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p className={cn('text-2xl font-black tracking-tight mb-0.5', isLight ? 'text-slate-900' : 'text-white')}>{value ?? '—'}</p>
      <p className={cn('text-[11px] font-medium', isLight ? 'text-slate-500' : 'text-slate-400')}>{label}</p>
      {subtitle && <p className={cn('text-[10px] mt-0.5', isLight ? 'text-slate-400' : 'text-slate-500')}>{subtitle}</p>}
    </motion.div>
  )
}

/* ─── Status Badge ────────────────────────────────────────── */
function StatusBadge({ status }) {
  const info = STATUS_STYLES[status] || { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400', label: status }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border', info.bg)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', info.dot)} />{info.label}
    </span>
  )
}

function buildCSV(list) {
  const headers = ['Réf', 'Utilisateur', 'Montant', 'Devise', 'Statut', 'Téléphone', 'Opérateur', 'Date']
  const rows = list.map(w => [
    w.withdrawalId || '', w.userId || '', w.amount || 0, w.currency || 'XAF',
    w.status || '', w.recipientPhone || '', w.operator || '', w.createdAt || '',
  ])
  return '﻿' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
}

/* ════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════ */
export default function AdminWithdrawalsPage() {
  const theme = useSelector(state => state.ui.theme)
  const isLight = theme === 'light'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const containerCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'

  // ── Data ──
  const [allWithdrawals, setAllWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 15

  // ── Filters ──
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')

  // ── Single actions ──
  const [actionId, setActionId] = useState(null)
  const [actionType, setActionType] = useState(null)
  const [actioning, setActioning] = useState(false)

  // ── Batch selection ──
  const [selected, setSelected] = useState(new Set())

  const fetchAll = useCallback(async () => {
    try {
      if (loading) setLoading(true)
      else setRefreshing(true)
      setError(null)

      const res = await withdrawalsApi.list(page, pageSize, 'global')
      const data = res?.data?.data?.content || res?.data?.data || []
      setAllWithdrawals(Array.isArray(data) ? data : [])
      setTotalPages(res?.data?.data?.totalPages || 1)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur réseau')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page])

  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => { setPage(0); setSelected(new Set()) }, [statusFilter, periodFilter])

  // ── Stats ──
  const stats = useMemo(() => {
    const pending = allWithdrawals.filter(w => w.status === 'PENDING').length
    const completed = allWithdrawals.filter(w => w.status === 'COMPLETED').length
    const rejected = allWithdrawals.filter(w => w.status === 'REJECTED').length
    const totalVolume = allWithdrawals
      .filter(w => w.status === 'COMPLETED')
      .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0)
    const approvalRate = (completed + rejected) > 0
      ? Math.round((completed / (completed + rejected)) * 100) : 0
    return { pending, completed, rejected, totalVolume, approvalRate, total: allWithdrawals.length }
  }, [allWithdrawals])

  // ── Filtrage ──
  const filtered = useMemo(() => {
    let list = [...allWithdrawals]
    if (statusFilter) list = list.filter(w => w.status === statusFilter)
    if (periodFilter) {
      const cutoff = getPeriodDate(periodFilter)
      if (cutoff) list = list.filter(w => new Date(w.createdAt) >= cutoff)
    }
    return list
  }, [allWithdrawals, statusFilter, periodFilter])

  const hasActiveFilters = statusFilter || periodFilter

  // ── Batch helpers ──
  const pendingFiltered = useMemo(() => filtered.filter(w => w.status === 'PENDING'), [filtered])
  const allFilteredIds = useMemo(() => filtered.map(w => w.withdrawalId || w.id).filter(Boolean), [filtered])
  const pendingFilteredIds = useMemo(() => pendingFiltered.map(w => w.withdrawalId || w.id).filter(Boolean), [pendingFiltered])
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(pendingFilteredIds))
  }

  const handleBatchAction = async (batchType) => {
    if (selected.size === 0) return
    setActioning(true)
    try {
      const fn = batchType === 'approve' ? withdrawalsApi.batchApprove : withdrawalsApi.batchReject
      const { data } = await fn(Array.from(selected))
      if (data?.success) {
        toast.success(`${selected.size} retrait${selected.size !== 1 ? 's' : ''} ${batchType === 'approve' ? 'approuvé(s)' : 'rejeté(s)'}`)
        setAllWithdrawals(prev => prev.map(w => {
          const wid = w.withdrawalId || w.id
          return selected.has(wid)
            ? { ...w, status: batchType === 'approve' ? 'COMPLETED' : 'REJECTED' }
            : w
        }))
        setSelected(new Set())
      } else {
        toast.error(data?.message || 'Erreur')
      }
    } catch {
      toast.error("Erreur lors de l'action groupée")
    } finally {
      setActioning(false)
      setActionType(null)
    }
  }

  // ── Single action ──
  const handleSingleAction = async () => {
    if (!actionId || !actionType) return
    setActioning(true)
    try {
      const fn = actionType === 'approve' ? withdrawalsApi.approve : withdrawalsApi.reject
      const { data } = await fn(actionId)
      if (data?.success) {
        toast.success(actionType === 'approve' ? 'Retrait approuvé' : 'Retrait rejeté')
        setAllWithdrawals(prev => prev.map(w =>
          (w.withdrawalId === actionId || w.id === actionId)
            ? { ...w, status: actionType === 'approve' ? 'COMPLETED' : 'REJECTED' }
            : w
        ))
      } else {
        toast.error(data?.message || 'Erreur')
      }
    } catch {
      toast.error("Erreur lors de l'action")
    } finally {
      setActionId(null)
      setActionType(null)
      setActioning(false)
    }
  }

  const handleExportCSV = () => {
    const csv = buildCSV(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `retraits_admin_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success('CSV exporté')
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className={cn('w-11 h-11 rounded-2xl', isLight ? 'bg-slate-200' : 'bg-slate-800')} />
          <div className="space-y-1.5">
            <div className={cn('h-5 w-48 rounded-lg', isLight ? 'bg-slate-200' : 'bg-slate-800')} />
            <div className={cn('h-4 w-64 rounded-lg', isLight ? 'bg-slate-200' : 'bg-slate-800')} />
          </div>
        </div>
        <LoadingSkeleton type="table" isLight={isLight} rows={5} />
      </div>
    )
  }

  const isBatch = actionType === 'batch-approve' || actionType === 'batch-reject'
  const batchActionLabel = actionType === 'batch-approve' ? 'Approuver' : 'Rejeter'

  return (
    <div className="space-y-6 pb-16">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', isLight ? 'bg-rose-50 text-rose-600' : 'bg-rose-500/10 text-rose-400')}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className={cn('text-xl font-black tracking-tight', textPrimary)}>Gestion des retraits</h1>
            <p className={cn('text-[11px]', textSecondary)}>
              {stats.total} retrait{stats.total !== 1 ? 's' : ''} · {stats.pending} en attente
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} disabled={filtered.length === 0}
            className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors',
              isLight ? 'text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40' : 'text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40')}>
            <DownloadCloud className="w-3 h-3" /> CSV
          </button>
          <button onClick={fetchAll} aria-label="Rafraîchir"
            className={cn('flex items-center justify-center w-9 h-9 rounded-xl', isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800')}>
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="En attente" value={stats.pending} icon={Clock} color="amber" isLight={isLight}
          subtitle={stats.total > 0 ? `${((stats.pending / stats.total) * 100).toFixed(0)}% du total` : ''} />
        <KpiCard label="Volume total retiré" value={formatXAF(stats.totalVolume)} icon={Wallet} color="blue" isLight={isLight} />
        <KpiCard label="Taux d'approbation" value={stats.approvalRate > 0 ? `${stats.approvalRate}%` : '—'} icon={TrendingUp} color={stats.approvalRate >= 70 ? 'emerald' : 'amber'} isLight={isLight} />
        <KpiCard label="Demandes total" value={stats.total} icon={Users} color="rose" isLight={isLight} />
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-wrap">
        {STATUS_FILTERS.map(f => {
          const active = statusFilter === f.key
          return (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={cn('shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap',
                active ? 'bg-blue-500 text-white' : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
              {f.label}
            </button>
          )
        })}
        <span className={cn('w-px h-5 mx-1', isLight ? 'bg-slate-300' : 'bg-slate-700')} />
        {PERIOD_FILTERS.map(f => {
          const active = periodFilter === f.key
          return (
            <button key={f.key} onClick={() => setPeriodFilter(f.key)}
              className={cn('shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap',
                active ? 'bg-blue-500 text-white' : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
              {f.label}
            </button>
          )
        })}
      </div>

      {/* ── Error ── */}
      {error && <ErrorState error={error} onRetry={fetchAll} isLight={isLight} />}

      {/* ── Table ── */}
      {!error && (
        <>
          {filtered.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-2xl overflow-hidden', containerCls)}>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                      <Th isLight={isLight} className="w-10">
                        <button onClick={toggleSelectAll} className="cursor-pointer" title={allSelected ? 'Tout désélectionner' : 'Sélectionner les PENDING'}>
                          {allSelected ? <CheckSquare className="w-3.5 h-3.5 text-blue-400" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                      </Th>
                      <Th isLight={isLight}>Réf</Th>
                      <Th isLight={isLight}>Utilisateur</Th>
                      <Th isLight={isLight}>Téléphone</Th>
                      <Th isLight={isLight}>Montant</Th>
                      <Th isLight={isLight}>Statut</Th>
                      <Th isLight={isLight}>Date</Th>
                      <Th isLight={isLight}>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((w, i) => {
                      const wid = w.withdrawalId || w.id
                      const isChecked = selected.has(wid)
                      const isPending = w.status === 'PENDING'
                      return (
                        <tr key={wid || i}
                          className={cn('border-b transition-colors', isLight ? 'border-slate-100 hover:bg-slate-50' : 'border-slate-800/50 hover:bg-slate-800/30',
                            isChecked && (isLight ? 'bg-blue-50/50' : 'bg-blue-500/5'))}>
                          <Td>
                            <button onClick={() => toggleSelect(wid)}
                              disabled={!isPending}
                              className={cn('cursor-pointer', !isPending && 'opacity-20')}>
                              {isChecked
                                ? <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                                : <Square className="w-3.5 h-3.5" />}
                            </button>
                          </Td>
                          <Td><span className={cn('font-mono font-semibold', textPrimary)}>{wid?.slice(0, 8) || '—'}</span></Td>
                          <Td><span className="font-mono text-[10px] text-slate-400">{w.userId ? w.userId.slice(0, 8) + '…' : '—'}</span></Td>
                          <Td><span className={textSecondary}>{w.recipientPhone || '—'}</span></Td>
                          <Td><span className={cn('font-bold', textPrimary)}>{formatXAF(w.amount || 0)}</span></Td>
                          <Td><StatusBadge status={w.status} /></Td>
                          <Td><span className={textSecondary}>{timeAgo(w.createdAt)}</span></Td>
                          <Td>
                            {isPending && (
                              <div className="flex items-center gap-1">
                                <button onClick={() => { setActionId(wid); setActionType('approve') }}
                                  className={cn('px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer', isLight ? 'text-emerald-600 hover:bg-emerald-50' : 'text-emerald-400 hover:bg-emerald-500/10')}>
                                  <CheckCircle className="w-3.5 h-3.5 inline mr-1" />Approuver
                                </button>
                                <button onClick={() => { setActionId(wid); setActionType('reject') }}
                                  className={cn('px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer', isLight ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10')}>
                                  <X className="w-3.5 h-3.5 inline mr-1" />Rejeter
                                </button>
                              </div>
                            )}
                            {w.status === 'COMPLETED' && <span className={cn('text-[10px]', textMuted)}>✅ Versé</span>}
                            {w.status === 'REJECTED' && <span className="text-[10px] text-red-400">❌ Rejeté</span>}
                            {w.status === 'CANCELLED' && <span className={cn('text-[10px]', textMuted)}>— Annulé</span>}
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-slate-800">
                {filtered.map((w, i) => {
                  const wid = w.withdrawalId || w.id
                  const isChecked = selected.has(wid)
                  const isPending = w.status === 'PENDING'
                  return (
                    <div key={wid || i} className={cn('p-3 space-y-2', isChecked && (isLight ? 'bg-blue-50/50' : 'bg-blue-500/5'))}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleSelect(wid)} disabled={!isPending} className={cn(!isPending && 'opacity-20')}>
                            {isChecked
                              ? <CheckSquare className="w-4 h-4 text-blue-400" />
                              : <Square className="w-4 h-4 text-slate-500" />}
                          </button>
                          <span className={cn('font-mono font-semibold text-[11px]', textPrimary)}>{wid?.slice(0, 8) || '—'}</span>
                        </div>
                        <StatusBadge status={w.status} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={textSecondary}>ID: {w.userId ? w.userId.slice(0, 8) + '…' : '—'}</span>
                        <span className={cn('font-bold', textPrimary)}>{formatXAF(w.amount || 0)}</span>
                      </div>
                      {isPending && (
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => { setActionId(wid); setActionType('approve') }}
                            className="flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 text-center">
                            Approuver
                          </button>
                          <button onClick={() => { setActionId(wid); setActionType('reject') }}
                            className="flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold bg-red-500/10 text-red-400 text-center">
                            Rejeter
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <Pagination page={page} totalPages={totalPages} onChange={setPage} isLight={isLight} />
            </motion.div>
          ) : (
            hasActiveFilters ? (
              <EmptyState icon={Search} title="Aucun résultat" message="Aucun retrait ne correspond aux filtres." isLight={isLight}
                action={{ label: 'Effacer les filtres', onClick: () => { setStatusFilter(''); setPeriodFilter('') }, variant: 'secondary' }} />
            ) : (
              <EmptyState icon={ShieldCheck} title="Aucun retrait" message="Aucune demande de retrait sur la plateforme pour le moment." isLight={isLight} />
            )
          )}
        </>
      )}

      {/* ── Batch action bar ── */}
      <AnimatePresence>
        {someSelected && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className={cn('fixed bottom-0 left-0 right-0 z-40 border-t px-4 py-3', isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-slate-900 border-slate-700 shadow-2xl')}
            style={{ marginLeft: '16rem' }}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <span className={cn('text-sm font-medium', textPrimary)}>
                {selected.size} retrait{selected.size !== 1 ? 's' : ''} sélectionné{selected.size !== 1 ? 's' : ''}
                <button onClick={() => setSelected(new Set())} className={cn('ml-2 text-[10px] underline cursor-pointer', textMuted)}>
                  Effacer
                </button>
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setActionType('batch-approve')}
                  className={cn('px-4 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer',
                    isLight ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-emerald-600 text-white hover:bg-emerald-500')}>
                  <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />Approuver
                </button>
                <button onClick={() => setActionType('batch-reject')}
                  className={cn('px-4 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer',
                    isLight ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-600 text-white hover:bg-red-500')}>
                  <X className="w-3.5 h-3.5 inline mr-1.5" />Rejeter
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm modals ── */}
      {/* Single action */}
      <ConfirmModal open={!!actionId && !isBatch} onClose={() => { setActionId(null); setActionType(null) }}
        onConfirm={handleSingleAction} loading={actioning}
        title={actionType === 'approve' ? 'Approuver le retrait' : 'Rejeter le retrait'}
        message={actionType === 'approve' ? 'Confirmer l\'approbation de cette demande ?' : 'Confirmer le rejet de cette demande ?'}
        confirmLabel={actionType === 'approve' ? 'Approuver' : 'Rejeter'} />

      {/* Batch action */}
      <ConfirmModal open={isBatch} onClose={() => setActionType(null)}
        onConfirm={() => handleBatchAction(actionType === 'batch-approve' ? 'approve' : 'reject')} loading={actioning}
        title={`${batchActionLabel} ${selected.size} retrait${selected.size !== 1 ? 's' : ''}`}
        message={`Confirmer le ${batchActionLabel.toLowerCase()}ment de ${selected.size} demande${selected.size !== 1 ? 's' : ''} de retrait ?`}
        confirmLabel={batchActionLabel} />
    </div>
  )
}

/* ─── Helpers table ───────────────────────────────────────── */
function Th({ children, isLight, className }) {
  return (
    <th className={cn('px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider', isLight ? 'text-slate-500 bg-slate-50' : 'text-slate-400 bg-slate-900/50', className)}>
      {children}
    </th>
  )
}
function Td({ children }) {
  return <td className="px-4 py-3">{children}</td>
}
