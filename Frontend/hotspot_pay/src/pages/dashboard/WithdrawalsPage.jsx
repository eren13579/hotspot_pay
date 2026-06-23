import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Download, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { withdrawalsApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/cn'
import { formatXAF, formatDateTime } from '../../utils/format'
import EmptyState, { LoadingSkeleton, ErrorState } from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import {
  WithdrawalsHeader, WithdrawalsStats, WithdrawalsTable,
  WithdrawalsMobileCards, NewWithdrawalModal,
} from '../../components/withdrawals'
import ConfirmModal from '../../components/ui/ConfirmModal'

const PLAN_LEVEL = { STANDARD: 0, PRO: 1, PREMIUM: 2 }

const WITHDRAWAL_STATUS_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'APPROVED', label: 'Approuvés' },
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

function buildCSV(withdrawals) {
  const headers = ['Référence', 'Montant', 'Devise', 'Statut', 'Téléphone', 'Opérateur', 'Date']
  const rows = withdrawals.map((w) => [
    w.withdrawalId || w.id || '', w.amount || 0, w.currency || 'XAF',
    w.status || '', w.recipientPhone || '', w.operator || '',
    w.createdAt || '',
  ])
  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))]
  return '﻿' + csv.join('\n')
}

export default function WithdrawalsPage() {
  const theme = useSelector((state) => state.ui.theme)
  const { user, role } = useAuth()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const isLight = theme === 'light'
  const planLevel = PLAN_LEVEL[user?.planType] ?? 0
  const isPro = planLevel >= 1
  const isPremium = planLevel >= 2

  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const containerCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'

  // ── Data ─────────────────────────────────────────────────────────────
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 10

  // ── Filters ───────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [scope, setScope] = useState('self')

  // ── New withdrawal ────────────────────────────────────────────────────
  const [showNewModal, setShowNewModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Cancel ────────────────────────────────────────────────────────────
  const [cancelId, setCancelId] = useState(null)

  // ── Admin approve/reject ──────────────────────────────────────────────
  const [actionId, setActionId] = useState(null)
  const [actionType, setActionType] = useState(null) // 'approve' | 'reject'
  const [actioning, setActioning] = useState(false)

  const fetchWithdrawals = useCallback(async () => {
    try {
      if (loading) setLoading(true)
      else setRefreshing(true)
      setError(null)

      const res = await withdrawalsApi.list(page, pageSize, scope)

      const data = res?.data?.data?.content || res?.data?.data || res?.data || []
      setWithdrawals(Array.isArray(data) ? data : [])
      setTotalPages(res?.data?.data?.totalPages || Math.ceil((Array.isArray(data) ? data.length : 0) / pageSize))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur réseau')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [loading, page, scope])

  useEffect(() => { fetchWithdrawals() }, [fetchWithdrawals])

  useEffect(() => { setPage(0) }, [statusFilter, periodFilter, scope])

  // ── Combined filter ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...withdrawals]
    if (statusFilter) list = list.filter((w) => w.status === statusFilter)
    if (periodFilter) {
      const cutoff = getPeriodDate(periodFilter)
      if (cutoff) list = list.filter((w) => {
        const d = new Date(w.createdAt)
        return d >= cutoff
      })
    }
    return list
  }, [withdrawals, statusFilter, periodFilter])

  const hasActiveFilters = statusFilter || periodFilter
  const activeFiltersCount = [statusFilter, periodFilter].filter(Boolean).length

  // ── New withdrawal ────────────────────────────────────────────────────
  const handleNewWithdrawal = async (data) => {
    setSubmitting(true)
    try {
      const { data: res } = await withdrawalsApi.create(data)
      if (res?.success) {
        toast.success('Demande de retrait envoyée')
        setShowNewModal(false)
        fetchWithdrawals()
      } else {
        toast.error(res?.message || 'Erreur')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la demande')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Cancel ────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!cancelId) return
    try {
      const { data } = await withdrawalsApi.cancel(cancelId)
      if (data?.success) {
        toast.success('Retrait annulé')
        setWithdrawals((prev) => prev.map((w) =>
          (w.withdrawalId === cancelId || w.id === cancelId) ? { ...w, status: 'CANCELLED' } : w
        ))
      } else {
        toast.error(data?.message || 'Erreur')
      }
    } catch {
      toast.error("Erreur lors de l'annulation")
    } finally {
      setCancelId(null)
    }
  }

  // ── Admin approve / reject ────────────────────────────────────────────
  const handleAction = async () => {
    if (!actionId || !actionType) return
    setActioning(true)
    try {
      const fn = actionType === 'approve' ? withdrawalsApi.approve : withdrawalsApi.reject
      const { data } = await fn(actionId)
      if (data?.success) {
        toast.success(actionType === 'approve' ? 'Retrait approuvé' : 'Retrait rejeté')
        setWithdrawals((prev) => prev.map((w) =>
          (w.withdrawalId === actionId || w.id === actionId)
            ? { ...w, status: actionType === 'approve' ? 'APPROVED' : 'REJECTED' }
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

  // ── CSV Export ────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const csv = buildCSV(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `retraits_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exporté')
  }

  // ── Loading ───────────────────────────────────────────────────────────
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <WithdrawalsHeader
        isLight={isLight}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        refreshing={refreshing}
        onRefresh={fetchWithdrawals}
        totalCount={withdrawals.length}
        scope={scope}
        isAdmin={isAdmin}
        onScopeChange={setScope}
        onNew={() => setShowNewModal(true)}
      />

      {/* Stats — PRO+ */}
      {isPro && withdrawals.length > 0 && (
        <WithdrawalsStats withdrawals={withdrawals} isLight={isLight} />
      )}

      {/* Filters row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
          {/* Status pills */}
          {WITHDRAWAL_STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key
            return (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={cn('shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap',
                  active ? 'bg-blue-500 text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2' : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
                {f.label}
                {active && f.key && (
                  <X onClick={(e) => { e.stopPropagation(); setStatusFilter('') }} className="w-3 h-3 ml-1 cursor-pointer opacity-60 hover:opacity-100" />
                )}
              </button>
            )
          })}

          {/* Period filter */}
          {isPro && PERIOD_FILTERS.map((f) => {
            const active = periodFilter === f.key
            return (
              <button key={f.key} onClick={() => setPeriodFilter(f.key)}
                className={cn('shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap',
                  active ? 'bg-blue-500 text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2' : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-400 hover:bg-slate-700')}>
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Right actions — PRO+ */}
        {isPro && filtered.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleExportCSV}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer',
                isLight ? 'text-slate-600 bg-slate-100 hover:bg-slate-200' : 'text-slate-300 bg-slate-800 hover:bg-slate-700')}>
              <Download className="w-3 h-3" /> CSV
            </button>
          </div>
        )}
      </div>

      {error && <ErrorState error={error} onRetry={fetchWithdrawals} isLight={isLight} title="Erreur de chargement" />}

      {!error && (
        <>
          {filtered.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-2xl overflow-hidden', containerCls)}>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <WithdrawalsTable
                  withdrawals={filtered}
                  isLight={isLight}
                  textMuted={textMuted}
                  onCancel={setCancelId}
                  isPremium={isPremium}
                  isAdmin={isAdmin}
                  onApprove={(id) => { setActionId(id); setActionType('approve') }}
                  onReject={(id) => { setActionId(id); setActionType('reject') }}
                />
              </div>
              {/* Mobile cards */}
              <div className="sm:hidden p-3">
                <WithdrawalsMobileCards
                  withdrawals={filtered}
                  isLight={isLight}
                  textMuted={textMuted}
                  onCancel={setCancelId}
                />
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} isLight={isLight} />
            </motion.div>
          ) : (
            hasActiveFilters ? (
              <EmptyState icon={Search} title="Aucun résultat"
                message="Aucun retrait ne correspond à vos filtres."
                isLight={isLight}
                action={{ label: 'Effacer les filtres', onClick: () => { setStatusFilter(''); setPeriodFilter('') }, variant: 'secondary' }}
              />
            ) : (
              <EmptyState icon="Wallet" title="Aucun retrait"
                message="Vous n'avez pas encore effectué de retrait."
                isLight={isLight}
              />
            )
          )}
        </>
      )}

      {/* New withdrawal modal */}
      <NewWithdrawalModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleNewWithdrawal}
        submitting={submitting}
        isLight={isLight}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />

      {/* Cancel confirmation */}
      <ConfirmModal open={!!cancelId} onClose={() => setCancelId(null)} onConfirm={handleCancel}
        title="Annuler le retrait" message="Cette action est irréversible." confirmLabel="Annuler le retrait" />

      {/* Admin approve/reject confirmation */}
      <ConfirmModal open={!!actionId} onClose={() => { setActionId(null); setActionType(null) }}
        onConfirm={handleAction}
        loading={actioning}
        title={actionType === 'approve' ? 'Approuver le retrait' : 'Rejeter le retrait'}
        message={actionType === 'approve' ? "Confirmer l'approbation de cette demande de retrait ?" : "Confirmer le rejet de cette demande de retrait ?"}
        confirmLabel={actionType === 'approve' ? 'Approuver' : 'Rejeter'}
      />
    </div>
  )
}
