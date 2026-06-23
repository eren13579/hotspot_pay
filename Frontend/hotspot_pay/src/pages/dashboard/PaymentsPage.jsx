/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Activity, X, Download, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { paymentsApi, hotspotsApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { setSearchQuery } from '../../store/uiSlice'
import { cn } from '../../utils/cn'
import { formatXAF } from '../../utils/format'
import EmptyState, { LoadingSkeleton, ErrorState, NoSearchResults } from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import {
  PaymentsHeader, PaymentsStats, PaymentsTable,
  PaymentsMobileCards, PaymentDetailModal,
} from '../../components/payments'

const PLAN_LEVEL = { STANDARD: 0, PRO: 1, PREMIUM: 2 }

const PAYMENT_STATUS_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'SUCCESS', label: 'Réussis' },
  { key: 'FAILED', label: 'Échoués' },
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
  { key: 'CAMPAY', label: 'CamPay' },
]

function getPeriodDate(period) {
  const now = new Date()
  switch (period) {
    case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    default: return null
  }
}

function groupByDate(payments, days = 7) {
  const groups = {}
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    groups[key] = { date: key, amount: 0, count: 0, label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }) }
  }
  payments.forEach((p) => {
    if (p.status !== 'SUCCESS') return
    const d = (p.created_at || p.createdAt || '').slice(0, 10)
    if (groups[d]) { groups[d].amount += Number(p.amount) || 0; groups[d].count++ }
  })
  return Object.values(groups)
}

function buildCSV(payments) {
  const headers = ['Référence', 'Client', 'Opérateur', 'Montant', 'Devise', 'Statut', 'Date', 'Transaction ID']
  const rows = payments.map((p) => [
    p.reference || '', p.client_phone || '', p.operator || '',
    p.amount || 0, p.currency || 'XAF',
    p.status || '', p.created_at || p.createdAt || '',
    p.gateway_tx_id || '',
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))]
  return '﻿' + csv.join('\n')
}

export default function PaymentsPage() {
  const theme = useSelector((state) => state.ui.theme)
  const searchQuery = useSelector((state) => state.ui.searchQuery)
  const { user, role } = useAuth()
  const dispatch = useDispatch()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const uid = user?.userId || ''
  const isLight = theme === 'light'
  const planLevel = PLAN_LEVEL[user?.planType] ?? 0
  const isPro = planLevel >= 1
  const isPremium = planLevel >= 2

  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const containerCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'

  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [hotspots, setHotspots] = useState([])
  const [selectedHotspotId, setSelectedHotspotId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [scope, setScope] = useState(isAdmin ? 'global' : 'self')
  const [detailPayment, setDetailPayment] = useState(null)
  const [page, setPage] = useState(0)
  const pageSize = 10

  // ── NEW: Search, filters, features ──
  const [periodFilter, setPeriodFilter] = useState('')
  const [operatorFilter, setOperatorFilter] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [refundingId, setRefundingId] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  // Charger les hotspots
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await (isAdmin
          ? hotspotsApi.adminList(0, 100, scope)
          : hotspotsApi.list(uid, 0, 100, scope))
        const list = res?.data?.data?.content || res?.data?.data || []
        setHotspots(Array.isArray(list) ? list : [])
        if (!isAdmin && Array.isArray(list) && list.length > 0 && !selectedHotspotId) {
          setSelectedHotspotId(list[0].hotspot_id || list[0].id)
        }
      } catch { /* silencieux */ }
    }
    fetch()
  }, [uid, isAdmin, scope, selectedHotspotId])

  // Charger les paiements
  const fetchPayments = useCallback(async () => {
    try {
      if (loading) setLoading(true)
      else setRefreshing(true)
      setError(null)

      const res = selectedHotspotId
        ? await paymentsApi.list(selectedHotspotId)
        : await Promise.all(
            hotspots.map((h) => paymentsApi.list(h.hotspot_id || h.id).catch(() => null))
          ).then((results) => {
            const all = results.filter(Boolean).flatMap((r) => r?.data?.data || r?.data || [])
            return { data: { data: all } }
          })

      const data = res?.data?.data || res?.data || []
      const list = Array.isArray(data) ? data : data.payments || data.items || data.content || []
      setPayments(list)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur réseau')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedHotspotId, hotspots, loading])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  // ── Filtrage combiné ──
  const filtered = useMemo(() => {
    let list = payments

    // Statut
    if (statusFilter) list = list.filter((p) => p.status === statusFilter)

    // Période
    const periodDate = getPeriodDate(periodFilter)
    if (periodDate) {
      list = list.filter((p) => {
        const d = new Date(p.created_at || p.createdAt || 0)
        return d >= periodDate
      })
    }

    // Opérateur (PRO+)
    if (operatorFilter && isPro) {
      list = list.filter((p) => p.operator === operatorFilter)
    }

    // Montant min/max (PREMIUM)
    if (isPremium) {
      if (amountMin) list = list.filter((p) => Number(p.amount || 0) >= Number(amountMin))
      if (amountMax) list = list.filter((p) => Number(p.amount || 0) <= Number(amountMax))
    }

    // Recherche texte
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((p) =>
        (p.reference || '').toLowerCase().includes(q) ||
        (p.client_phone || '').includes(q) ||
        (p.gateway_tx_id || '').toLowerCase().includes(q)
      )
    }

    return list
  }, [payments, statusFilter, periodFilter, operatorFilter, amountMin, amountMax, searchQuery, isPro, isPremium])

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedPayments = filtered.slice(page * pageSize, (page + 1) * pageSize)

  useEffect(() => { setPage(0) }, [payments.length, statusFilter, periodFilter, operatorFilter, searchQuery, selectedHotspotId])

  // ── Trend graph (PRO+) ──
  const trendData = useMemo(() => isPro ? groupByDate(payments, 7) : [], [payments, isPro])
  const maxTrendAmount = Math.max(...trendData.map((d) => d.amount), 1)

  // ── Export CSV (PRO+) ──
  const handleExport = () => {
    if (!isPro) return
    const data = filtered.length > 0 ? filtered : payments
    if (!data.length) { toast.error('Aucune donnée à exporter'); return }
    const csv = buildCSV(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `paiements_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success(`Exporté ${data.length} paiement${data.length !== 1 ? 's' : ''}`)
  }

  // ── Refresh PENDING status ──
  const handleRefreshStatus = async (payment) => {
    const ref = payment.reference || payment.ref
    if (!ref) { toast.error('Référence manquante'); return }
    try {
      const res = await paymentsApi.portalStatus(ref)
      const updated = res?.data?.data || res?.data
      if (updated?.status) {
        setPayments((prev) => prev.map((p) =>
          (p.reference === ref) ? { ...p, status: updated.status, paid_at: updated.paid_at || p.paid_at } : p
        ))
        toast.success(`Statut mis à jour : ${updated.status}`)
      } else {
        toast.info('Statut inchangé')
      }
    } catch { toast.error('Erreur de vérification') }
  }

  // ── Refund (admin + PREMIUM) ──
  const handleRefund = async (paymentId) => {
    if (!isPremium || !isAdmin) return
    setRefundingId(paymentId)
    try {
      const { data } = await paymentsApi.refund(paymentId)
      if (data?.success) {
        toast.success('Remboursement effectué')
        setPayments((prev) => prev.map((p) =>
          (p.id === paymentId || p.payment_id === paymentId) ? { ...p, status: 'REFUNDED' } : p
        ))
      } else {
        toast.error(data?.message || 'Erreur de remboursement')
      }
    } catch { toast.error('Erreur lors du remboursement') }
    finally { setRefundingId(null) }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-11 h-11 rounded-2xl bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-5 w-32 bg-slate-800 rounded-lg" />
            <div className="h-4 w-48 bg-slate-800 rounded-lg" />
          </div>
        </div>
        <LoadingSkeleton type="table" isLight={isLight} rows={5} />
      </div>
    )
  }

  // ── Non-admin sans hotspot ──
  if (!isAdmin && hotspots.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400')}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className={cn('text-xl font-black tracking-tight', textPrimary)}>Paiements</h1>
            <p className={cn('text-xs', textSecondary)}>Aucune transaction</p>
          </div>
        </div>
        <EmptyState icon="Activity" title="Aucun hotspot" message="Vous n'avez pas encore de hotspot." isLight={isLight} />
      </div>
    )
  }

  const activeFilters = [statusFilter, periodFilter, operatorFilter, amountMin, amountMax].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <PaymentsHeader isLight={isLight} textPrimary={textPrimary} textSecondary={textSecondary}
        refreshing={refreshing} onRefresh={fetchPayments}
        hotspots={hotspots} selectedHotspotId={selectedHotspotId}
        onHotspotSelect={setSelectedHotspotId}
        totalCount={payments.length}
        scope={scope} isAdmin={isAdmin} onScopeChange={setScope} />

      {/* ── FILTER TOGGLE & CSV EXPORT ── */}
      <div className="flex items-center gap-2">
        <button onClick={() => setShowFilters(!showFilters)}
          className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border', isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-slate-700 text-slate-400 hover:bg-slate-800', showFilters && (isLight ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-blue-500/30 bg-blue-500/10 text-blue-400'))}>
          <Filter className="w-3.5 h-3.5" />
          Filtres{activeFilters > 0 ? ` (${activeFilters})` : ''}
        </button>
        {isPro && (
          <button onClick={handleExport}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border', isLight ? 'border-slate-200 text-emerald-600 hover:bg-emerald-50' : 'border-slate-700 text-emerald-400 hover:bg-emerald-500/10')}>
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        )}
      </div>

      {/* ── FILTERS PANEL ── */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-2xl p-4 space-y-3 border', isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800')}>
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-bold', textPrimary)}>Filtres avancés</span>
            <button onClick={() => setShowFilters(false)} className={cn('text-[10px] cursor-pointer', textMuted)}>
              <X className="w-3 h-3 inline" /> Fermer
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Période */}
            <div className="min-w-35">
              <label className={cn('block text-[10px] font-medium mb-1', textMuted)}>Période</label>
              <div className="flex gap-1">
                {PERIOD_FILTERS.map((f) => (
                  <button key={f.key} onClick={() => setPeriodFilter(periodFilter === f.key ? '' : f.key)}
                    className={cn('px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer whitespace-nowrap', periodFilter === f.key ? 'bg-blue-500 text-white' : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Opérateur (PRO+) */}
            {isPro && (
              <div className="min-w-35">
                <label className={cn('block text-[10px] font-medium mb-1', textMuted)}>Opérateur</label>
                <div className="flex gap-1">
                  {OPERATOR_FILTERS.map((f) => (
                    <button key={f.key} onClick={() => setOperatorFilter(operatorFilter === f.key ? '' : f.key)}
                      className={cn('px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer whitespace-nowrap', operatorFilter === f.key ? 'bg-blue-500 text-white' : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Montant min/max (PREMIUM) */}
            {isPremium && (
              <div className="min-w-50">
                <label className={cn('block text-[10px] font-medium mb-1', textMuted)}>Montant (min - max)</label>
                <div className="flex items-center gap-1">
                  <input type="number" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} placeholder="Min"
                    className={cn('w-20 px-2 py-1 rounded-lg text-[10px] outline-none border', isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white')} />
                  <span className={textMuted}>—</span>
                  <input type="number" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} placeholder="Max"
                    className={cn('w-20 px-2 py-1 rounded-lg text-[10px] outline-none border', isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white')} />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── STATS ── */}
      <PaymentsStats payments={payments} isLight={isLight} />

      {/* ── TREND GRAPH (PRO+) ── */}
      {isPro && trendData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-2xl p-4 border', isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800')}>
          <div className="flex items-center justify-between mb-3">
            <span className={cn('text-xs font-bold', textPrimary)}>Tendance (7 jours)</span>
            <span className={cn('text-[10px]', textMuted)}>
              {formatXAF(trendData.reduce((s, d) => s + d.amount, 0))} encaissés
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-24">
            {trendData.map((d) => {
              const height = d.amount > 0 ? Math.max((d.amount / maxTrendAmount) * 100, 8) : 4
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className={cn('text-[8px] font-medium', d.amount > 0 ? textPrimary : textMuted)}>
                    {d.amount > 0 ? formatXAF(d.amount) : ''}
                  </span>
                  <div className="w-full flex justify-center">
                    <div className={cn('w-full max-w-8 rounded-t-md transition-all duration-500', d.amount > 0 ? 'bg-blue-500' : 'bg-slate-700/30')} style={{ height: `${height}%` }} />
                  </div>
                  <span className={cn('text-[8px]', textMuted)}>{d.label}</span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ── STATUS FILTER ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {PAYMENT_STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key
            return (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={cn('shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap', active ? isLight ? 'bg-blue-500 text-white shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2' : 'bg-blue-500 text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2' : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
                {f.label}
                {active && f.key && (
                  <X onClick={(e) => { e.stopPropagation(); setStatusFilter('') }} className="inline w-2.5 h-2.5 ml-1 cursor-pointer" />
                )}
              </button>
            )
          })}
        </div>
        <span className={cn('text-[10px]', textMuted)}>{filtered.length} sur {payments.length} paiement{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── ERROR ── */}
      {error && <ErrorState error={error} onRetry={fetchPayments} isLight={isLight} title="Erreur de chargement" />}

      {/* ── CONTENT ── */}
      {!error && (
        <>
          {filtered.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-2xl overflow-hidden', containerCls)}>
              <div className="hidden sm:block">
                <PaymentsTable payments={paginatedPayments} isLight={isLight} textMuted={textMuted}
                  onDetails={setDetailPayment}
                  isPro={isPro} isPremium={isPremium} isAdmin={isAdmin}
                  onRefreshStatus={handleRefreshStatus}
                  onRefund={handleRefund} refundingId={refundingId} />
              </div>
              <div className="sm:hidden p-3">
                <PaymentsMobileCards payments={paginatedPayments} isLight={isLight} textMuted={textMuted}
                  onDetails={setDetailPayment} />
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} isLight={isLight} />
            </motion.div>
          ) : (
            <EmptyState title={statusFilter || periodFilter || searchQuery ? 'Aucun paiement' : 'Aucune transaction'}
              message={searchQuery ? 'Aucun résultat pour votre recherche.' : statusFilter ? 'Aucun paiement ne correspond à ce filtre.' : selectedHotspotId ? "Ce hotspot n'a aucune transaction." : 'Les paiements apparaîtront lorsque des clients achèteront des forfaits.'}
              icon="Activity" isLight={isLight} />
          )}

          {filtered.length === 0 && payments.length > 0 && (
            <NoSearchResults isLight={isLight} onClear={() => { dispatch(setSearchQuery('')); setStatusFilter(''); setPeriodFilter(''); setOperatorFilter(''); setAmountMin(''); setAmountMax('') }} />
          )}
        </>
      )}

      {/* ── DETAIL MODAL ── */}
      <PaymentDetailModal payment={detailPayment} onClose={() => setDetailPayment(null)} isLight={isLight}
        isPremium={isPremium} isAdmin={isAdmin}
        onRefreshStatus={handleRefreshStatus}
        onRefund={handleRefund} refundingId={refundingId} />
    </div>
  )
}
