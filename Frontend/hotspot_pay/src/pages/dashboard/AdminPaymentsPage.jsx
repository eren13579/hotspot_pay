import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  Search, X, CreditCard, DollarSign, TrendingUp, Users,
  RefreshCw, CheckCircle, Filter, DownloadCloud, AlertCircle,
  Clock, ArrowUpRight, Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { paymentsApi, hotspotsApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'
import { formatXAF, timeAgo } from '../../utils/format'
import EmptyState, { LoadingSkeleton, ErrorState } from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/ui/ConfirmModal'

/* ─── Constantes ──────────────────────────────────────────── */
const STATUS_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'SUCCESS', label: 'Réussis' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'FAILED', label: 'Échoués' },
  { key: 'REFUNDED', label: 'Remboursés' },
]

const PERIOD_FILTERS = [
  { key: '', label: 'Tout' },
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
]

const OPERATOR_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'MTN', label: 'MTN' },
  { key: 'ORANGE', label: 'Orange' },
  { key: 'MOOV', label: 'Moov' },
]

const STATUS_STYLES = {
  SUCCESS:  { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', label: 'Réussi' },
  PENDING:  { bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-400', label: 'En attente' },
  FAILED:   { bg: 'bg-red-500/10 text-red-400 border-red-500/20',      dot: 'bg-red-400',   label: 'Échoué' },
  REFUNDED: { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',   dot: 'bg-blue-400',   label: 'Remboursé' },
  CANCELLED:{ bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400', label: 'Annulé' },
}

function getPeriodDate(key) {
  const d = new Date()
  switch (key) {
    case 'today': d.setHours(0, 0, 0, 0); break
    case '7d': d.setDate(d.getDate() - 7); break
    case '30d': d.setDate(d.getDate() - 30); break
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
  const headers = ['Réf', 'Client', 'Hotspot', 'Opérateur', 'Montant', 'Devise', 'Statut', 'Date', 'Transaction ID']
  const rows = list.map(p => [
    p.reference || '', p.client_phone || '', p.hotspot_name || p.hotspotId || '',
    p.operator || '', p.amount || 0, p.currency || 'XAF',
    p.status || '', p.created_at || p.createdAt || '', p.gateway_tx_id || '',
  ])
  return '﻿' + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
}

/* ════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════ */
export default function AdminPaymentsPage() {
  const theme = useSelector(state => state.ui.theme)
  const isLight = theme === 'light'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const containerCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'

  // ── Data ──
  const [allPayments, setAllPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const pageSize = 20

  // ── Filters ──
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [operatorFilter, setOperatorFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Refund ──
  const [refundingId, setRefundingId] = useState(null)
  const [confirmRefund, setConfirmRefund] = useState(null)

  // ── Fetch ──
  const fetchPayments = useCallback(async () => {
    try {
      setError(null)
      if (loading) setLoading(true)
      else setRefreshing(true)

      // 1. Récupérer tous les hotspots
      const hsRes = await hotspotsApi.adminList(0, 500)
      const hotspots = hsRes?.data?.data?.content || hsRes?.data?.data || []
      const list = Array.isArray(hotspots) ? hotspots : []

      // 2. Récupérer les paiements de chaque hotspot
      const results = await Promise.allSettled(
        list.map(h => paymentsApi.list(h.hotspot_id || h.id).catch(() => null))
      )

      const all = results
        .filter(r => r.status === 'fulfilled' && r.value?.data?.data)
        .flatMap(r => {
          const items = r.value.data.data
          const arr = Array.isArray(items) ? items : items.payments || items.content || []
          return arr
        })

      setAllPayments(all)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur réseau')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [loading])

  useEffect(() => { fetchPayments() }, [fetchPayments])
  useEffect(() => { setPage(0) }, [statusFilter, periodFilter, operatorFilter, searchQuery])

  // ── Stats calculées ──
  const stats = useMemo(() => {
    const success = allPayments.filter(p => p.status === 'SUCCESS').length
    const pending = allPayments.filter(p => p.status === 'PENDING').length
    const failed = allPayments.filter(p => p.status === 'FAILED').length
    const refunded = allPayments.filter(p => p.status === 'REFUNDED').length
    const totalRevenue = allPayments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    const successRate = allPayments.length > 0
      ? Math.round((success / allPayments.length) * 100)
      : 0
    return { success, pending, failed, refunded, total: allPayments.length, totalRevenue, successRate }
  }, [allPayments])

  // ── Filtrage combiné ──
  const filtered = useMemo(() => {
    let list = [...allPayments]
    if (statusFilter) list = list.filter(p => p.status === statusFilter)
    if (periodFilter) {
      const cutoff = getPeriodDate(periodFilter)
      if (cutoff) list = list.filter(p => new Date(p.created_at || p.createdAt || 0) >= cutoff)
    }
    if (operatorFilter) list = list.filter(p => p.operator === operatorFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p =>
        (p.reference || '').toLowerCase().includes(q) ||
        (p.client_phone || '').includes(q) ||
        (p.gateway_tx_id || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [allPayments, statusFilter, periodFilter, operatorFilter, searchQuery])

  const hasActiveFilters = statusFilter || periodFilter || operatorFilter || searchQuery
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize)

  // ── Refund ──
  const handleRefund = async () => {
    if (!confirmRefund) return
    setRefundingId(confirmRefund)
    try {
      const { data } = await paymentsApi.refund(confirmRefund)
      if (data?.success) {
        toast.success('Paiement remboursé')
        setAllPayments(prev => prev.map(p =>
          (p.id === confirmRefund || p.payment_id === confirmRefund)
            ? { ...p, status: 'REFUNDED' }
            : p
        ))
      } else {
        toast.error(data?.message || 'Erreur de remboursement')
      }
    } catch {
      toast.error('Erreur lors du remboursement')
    } finally {
      setRefundingId(null)
      setConfirmRefund(null)
    }
  }

  // ── CSV ──
  const handleExportCSV = () => {
    if (!filtered.length) { toast.error('Aucune donnée à exporter'); return }
    const csv = buildCSV(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `paiements_admin_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success(`Exporté ${filtered.length} paiement${filtered.length !== 1 ? 's' : ''}`)
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className={cn('w-11 h-11 rounded-2xl', isLight ? 'bg-slate-200' : 'bg-slate-800')} />
          <div className="space-y-1.5">
            <div className={cn('h-5 w-44 rounded-lg', isLight ? 'bg-slate-200' : 'bg-slate-800')} />
            <div className={cn('h-4 w-56 rounded-lg', isLight ? 'bg-slate-200' : 'bg-slate-800')} />
          </div>
        </div>
        <LoadingSkeleton type="table" isLight={isLight} rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400')}>
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className={cn('text-xl font-black tracking-tight', textPrimary)}>Paiements</h1>
            <p className={cn('text-[11px]', textSecondary)}>
              {stats.total} transaction{stats.total !== 1 ? 's' : ''} · {stats.successRate}% de succès
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} disabled={filtered.length === 0}
            className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors',
              isLight ? 'text-slate-600 bg-slate-100 hover:bg-slate-200' : 'text-slate-300 bg-slate-800 hover:bg-slate-700')}>
            <DownloadCloud className="w-3 h-3" /> CSV
          </button>
          <button onClick={fetchPayments} aria-label="Rafraîchir"
            className={cn('flex items-center justify-center w-9 h-9 rounded-xl', isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800')}>
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Revenu total" value={formatXAF(stats.totalRevenue)} icon={DollarSign} color="amber" isLight={isLight} />
        <KpiCard label="Transactions" value={stats.total} icon={CreditCard} color="blue" isLight={isLight}
          subtitle={`${stats.success} réussies, ${stats.failed} échouées`} />
        <KpiCard label="Taux de succès" value={`${stats.successRate}%`} icon={TrendingUp} color={stats.successRate >= 80 ? 'emerald' : 'amber'} isLight={isLight} />
        <KpiCard label="En attente" value={stats.pending} icon={Clock} color={stats.pending > 0 ? 'amber' : 'emerald'} isLight={isLight}
          subtitle={`${stats.refunded} remboursé${stats.refunded !== 1 ? 's' : ''}`} />
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className={cn('flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border', isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800')}>
          <Search className={cn('w-4 h-4', textMuted)} />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher (réf, téléphone, transaction)..."
            className={cn('flex-1 bg-transparent outline-none text-xs', textPrimary, 'placeholder:text-slate-500')} />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={cn('cursor-pointer', textMuted)}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Status + Period + Operator filters ── */}
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
        <span className={cn('w-px h-5 mx-1', isLight ? 'bg-slate-300' : 'bg-slate-700')} />
        {OPERATOR_FILTERS.map(f => {
          const active = operatorFilter === f.key
          return (
            <button key={f.key} onClick={() => setOperatorFilter(f.key)}
              className={cn('shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap',
                active ? 'bg-blue-500 text-white' : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
              {f.label}
            </button>
          )
        })}
      </div>

      {/* ── Error ── */}
      {error && <ErrorState error={error} onRetry={fetchPayments} isLight={isLight} />}

      {/* ── Table ── */}
      {!error && (
        <>
          {filtered.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-2xl overflow-hidden', containerCls)}>
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                      <Th isLight={isLight}>Réf</Th>
                      <Th isLight={isLight}>Client</Th>
                      <Th isLight={isLight}>Hotspot</Th>
                      <Th isLight={isLight}>Opérateur</Th>
                      <Th isLight={isLight}>Montant</Th>
                      <Th isLight={isLight}>Statut</Th>
                      <Th isLight={isLight}>Date</Th>
                      <Th isLight={isLight}>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((p, i) => {
                      const pid = p.id || p.payment_id || i
                      const isRefunding = refundingId === pid
                      return (
                        <tr key={pid}
                          className={cn('border-b transition-colors', isLight ? 'border-slate-100 hover:bg-slate-50' : 'border-slate-800/50 hover:bg-slate-800/30')}>
                          <Td><span className={cn('font-mono font-semibold', textPrimary)}>{(p.reference || '').slice(0, 10) || '—'}</span></Td>
                          <Td><span className="font-mono text-[10px] text-slate-400">{p.client_phone || '—'}</span></Td>
                          <Td><span className={textSecondary}>{p.hotspot_name || (p.hotspotId || '').slice(0, 8) || '—'}</span></Td>
                          <Td><span className={textSecondary}>{p.operator || '—'}</span></Td>
                          <Td><span className={cn('font-bold', textPrimary)}>{formatXAF(p.amount || 0)}</span></Td>
                          <Td><StatusBadge status={p.status} /></Td>
                          <Td><span className={textSecondary}>{timeAgo(p.created_at || p.createdAt)}</span></Td>
                          <Td>
                            {(p.status === 'SUCCESS' || p.status === 'PENDING') && (
                              <button onClick={() => setConfirmRefund(pid)}
                                disabled={isRefunding}
                                className={cn('px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer',
                                  isLight ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10',
                                  isRefunding && 'opacity-50 cursor-not-allowed')}>
                                {isRefunding ? '…' : 'Rembourser'}
                              </button>
                            )}
                            {p.status === 'REFUNDED' && <span className={cn('text-[10px]', textMuted)}>↩ Remboursé</span>}
                            {p.status === 'FAILED' && <span className={cn('text-[10px]', textMuted)}>✕ Échoué</span>}
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-slate-800">
                {paginated.map((p, i) => {
                  const pid = p.id || p.payment_id || i
                  const isRefunding = refundingId === pid
                  return (
                    <div key={pid} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={cn('font-mono font-semibold text-[11px]', textPrimary)}>{(p.reference || '').slice(0, 10) || '—'}</span>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={textSecondary}>{p.client_phone || '—'}</span>
                        <span className={cn('font-bold', textPrimary)}>{formatXAF(p.amount || 0)}</span>
                      </div>
                      {(p.status === 'SUCCESS' || p.status === 'PENDING') && (
                        <button onClick={() => setConfirmRefund(pid)} disabled={isRefunding}
                          className="w-full px-3 py-2 rounded-lg text-[11px] font-semibold bg-red-500/10 text-red-400 text-center disabled:opacity-50">
                          {isRefunding ? 'Remboursement…' : 'Rembourser'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              <Pagination page={page} totalPages={totalPages} onChange={setPage} isLight={isLight} />
            </motion.div>
          ) : (
            hasActiveFilters ? (
              <EmptyState icon={Search} title="Aucun résultat"
                message="Aucun paiement ne correspond aux filtres." isLight={isLight}
                action={{ label: 'Effacer les filtres', onClick: () => { setStatusFilter(''); setPeriodFilter(''); setOperatorFilter(''); setSearchQuery('') }, variant: 'secondary' }} />
            ) : (
              <EmptyState icon={CreditCard} title="Aucun paiement"
                message="Aucune transaction sur la plateforme pour le moment." isLight={isLight} />
            )
          )}
        </>
      )}

      {/* ── Confirm refund ── */}
      <ConfirmModal open={!!confirmRefund} onClose={() => setConfirmRefund(null)}
        onConfirm={handleRefund} loading={!!refundingId}
        title="Rembourser le paiement"
        message="Confirmer le remboursement de ce paiement ? Cette action est irréversible."
        confirmLabel="Rembourser" />
    </div>
  )
}

/* ─── Helpers table ───────────────────────────────────────── */
function Th({ children, isLight }) {
  return (
    <th className={cn('px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider', isLight ? 'text-slate-500 bg-slate-50' : 'text-slate-400 bg-slate-900/50')}>
      {children}
    </th>
  )
}
function Td({ children }) {
  return <td className="px-4 py-3">{children}</td>
}
