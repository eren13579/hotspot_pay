/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  LayoutDashboard, Users, Ticket, DollarSign, Calendar, Activity,
  Globe, Zap, Crown, ArrowUpRight, ArrowDownRight, Download, Wallet,
  CheckCircle, XCircle, Clock, TrendingUp,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { dashboardApi, withdrawalsApi, adminUsersApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'
import { formatDateTime, formatXAF } from '../../utils/format'
import  { LoadingSkeleton, ErrorState } from '../../components/ui/EmptyState'

/* ─── KPI Card ──────────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, trend, color, isLight, subtitle }) {
  const colorMap = {
    amber: isLight
      ? 'bg-amber-50 text-amber-600 border-amber-200'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: isLight
      ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: isLight
      ? 'bg-blue-50 text-blue-600 border-blue-200'
      : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    rose: isLight
      ? 'bg-rose-50 text-rose-600 border-rose-200'
      : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    sky: isLight
      ? 'bg-sky-50 text-sky-600 border-sky-200'
      : 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  }
  const c = colorMap[color] || colorMap.amber

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.02]',
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/50 border-slate-800 shadow-lg shadow-black/10',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', c)}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
            trend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10',
          )}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className={cn('text-2xl font-bold tracking-tight tabular-nums', isLight ? 'text-slate-900' : 'text-white')}>
        {value ?? '—'}
      </p>
      <p className={cn('text-xs mt-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
        {label}
      </p>
      {subtitle && <p className={cn('text-[10px] mt-0.5', isLight ? 'text-slate-400' : 'text-slate-500')}>{subtitle}</p>}
    </motion.div>
  )
}

/* ─── Statut Badge ───────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    SUCCESS: { cls: 'bg-emerald-500/20 text-emerald-400', label: 'Succès' },
    FAILED: { cls: 'bg-red-500/20 text-red-400', label: 'Échec' },
    PENDING: { cls: 'bg-amber-500/20 text-amber-400', label: 'En attente' },
  }
  const s = map[status] || { cls: 'bg-slate-500/20 text-slate-400', label: status }
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', s.cls)}>
      {s.label}
    </span>
  )
}

/* ─── Mini bar chart (CSS) ───────────────────────────────── */
function MiniBarChart({ data, color = '#F59E0B', isLight }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all duration-300"
            style={{
              height: `${(d.value / max) * 100}%`,
              backgroundColor: color,
              opacity: isLight ? 0.7 : 0.8,
              minHeight: d.value > 0 ? '4px' : '0',
            }}
          />
        </div>
      ))}
    </div>
  )
}

/* ─── Page principale ────────────────────────────────────── */
export default function AdminDashboardPage() {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const cardCls = isLight
    ? 'bg-white border border-slate-200 shadow-sm'
    : 'bg-slate-900/50 border border-slate-800 shadow-lg shadow-black/10'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('30d') // 7d, 30d, 90d
  const [withdrawalData, setWithdrawalData] = useState(null)
  const [withdrawalLoading, setWithdrawalLoading] = useState(true)
  const [planDistribution, setPlanDistribution] = useState(null)
  const [planLoading, setPlanLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const now = new Date()
      let startDate
      if (period === '7d') startDate = new Date(now.getTime() - 7 * 86400000)
      else if (period === '30d') startDate = new Date(now.getTime() - 30 * 86400000)
      else startDate = new Date(now.getTime() - 90 * 86400000)

      const fmt = (d) => d.toISOString().split('T')[0]
      const res = await dashboardApi.adminOverview(fmt(startDate), fmt(now))
      setData(res?.data?.data || null)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }, [period])

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await withdrawalsApi.list(0, 1000, 'global')
      const items = res?.data?.data?.content || res?.data?.data || []
      const list = Array.isArray(items) ? items : []
      const pending = list.filter(w => w.status === 'PENDING').length
      const completed = list.filter(w => w.status === 'COMPLETED').length
      const rejected = list.filter(w => w.status === 'REJECTED').length
      const totalVolume = list.filter(w => w.status === 'COMPLETED')
        .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0)
      const approvalRate = (pending + completed + rejected) > 0
        ? Math.round((completed / (completed + rejected)) * 100)
        : 0
      setWithdrawalData({ pending, completed, rejected, totalVolume, approvalRate, total: list.length })
    } catch { /* withdrawal stats non disponibles */ }
    finally { setWithdrawalLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchWithdrawals() }, [fetchWithdrawals])

  const fetchPlanDistribution = useCallback(async () => {
    setPlanLoading(true)
    try {
      const res = await adminUsersApi.list(0, 10000, {})
      const users = res?.data?.data?.content || res?.data?.data || []
      const list = Array.isArray(users) ? users : []
      const standard = list.filter(u => (u.planType || 'STANDARD').toUpperCase() === 'STANDARD').length
      const pro = list.filter(u => (u.planType || '').toUpperCase() === 'PRO').length
      const premium = list.filter(u => (u.planType || '').toUpperCase() === 'PREMIUM').length
      const total = standard + pro + premium || 1
      setPlanDistribution({ standard, pro, premium, total })
    } catch { /* silencieux */ }
    finally { setPlanLoading(false) }
  }, [])

  useEffect(() => { fetchPlanDistribution() }, [fetchPlanDistribution])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-11 h-11 rounded-2xl bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-5 w-44 bg-slate-800 rounded-lg" />
            <div className="h-4 w-56 bg-slate-800 rounded-lg" />
          </div>
        </div>
        <LoadingSkeleton type="card" isLight={isLight} rows={4} />
      </div>
    )
  }

  const revData = data?.revenueByDay?.map(r => ({ date: r.date, value: r.revenue })) || []
  const sessData = data?.sessionsByDay?.map(s => ({ date: s.date, value: s.sessions })) || []
  const totalRev = data?.totalRevenue ?? 0
  const revToday = data?.revenueToday ?? 0
  const revMonth = data?.revenueThisMonth ?? 0
  const prevRev = data?.previousPeriodRevenue ?? 0
  const currRev = data?.currentPeriodRevenue ?? 0
  const revTrend = prevRev > 0 ? Math.round(((currRev - prevRev) / prevRev) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center',
            isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400',
          )}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className={cn('text-xl font-bold tracking-tight', textPrimary)}>Vue d'ensemble</h1>
            <p className={cn('text-xs', textSecondary)}>Statistiques globales de la plateforme</p>
          </div>
        </div>
        {/* Period selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/50 border border-slate-700/50">
          {[
            { key: '7d', label: '7 jours' },
            { key: '30d', label: '30 jours' },
            { key: '90d', label: '90 jours' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer',
                period === opt.key
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorState error={error} onRetry={fetchData} isLight={isLight} />}

      {!error && data && (
        <>
          {/* Row 1 : KPIs principaux */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Revenu total"
              value={formatXAF(totalRev)}
              icon={DollarSign}
              trend={revTrend}
              color="amber"
              isLight={isLight}
            />
            <KpiCard
              label="Aujourd'hui"
              value={formatXAF(revToday)}
              icon={Zap}
              color="sky"
              isLight={isLight}
            />
            <KpiCard
              label="Ce mois"
              value={formatXAF(revMonth)}
              icon={Calendar}
              color="emerald"
              isLight={isLight}
            />
            <KpiCard
              label="Utilisateurs"
              value={data.totalUsers ?? 0}
              icon={Users}
              color="blue"
              isLight={isLight}
            />
          </div>

          {/* Row 2 : Hotspots + Sessions + Tickets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Hotspots"
              value={data.totalHotspots ?? 0}
              icon={Globe}
              color="sky"
              isLight={isLight}
            />
            <KpiCard
              label="En ligne"
              value={data.onlineHotspots ?? 0}
              icon={Activity}
              color="emerald"
              isLight={isLight}
            />
            <KpiCard
              label="Sessions actives"
              value={data.activeSessions ?? 0}
              icon={Users}
              color="blue"
              isLight={isLight}
            />
            <KpiCard
              label="Tickets"
              value={`${data.availableTickets ?? 0}/${data.totalTickets ?? 0}`}
              icon={Ticket}
              color="rose"
              isLight={isLight}
            />
          </div>

          {/* Row 3 : Retraits + Répartition plans */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Retraits en attente"
              value={withdrawalLoading ? '…' : (withdrawalData?.pending ?? 0)}
              icon={Clock}
              color={withdrawalData?.pending > 0 ? 'amber' : 'emerald'}
              isLight={isLight}
            />
            <KpiCard
              label="Volume total retiré"
              value={withdrawalLoading ? '…' : formatXAF(withdrawalData?.totalVolume ?? 0)}
              icon={Wallet}
              color="blue"
              isLight={isLight}
            />
            <KpiCard
              label="Taux d'approbation"
              value={withdrawalLoading ? '…' : `${withdrawalData?.approvalRate ?? 0}%`}
              icon={TrendingUp}
              color={withdrawalData?.approvalRate >= 70 ? 'emerald' : 'amber'}
              isLight={isLight}
            />
            <KpiCard
              label="Abonnés Standard"
              value={planLoading ? '…' : (planDistribution?.standard ?? 0)}
              icon={Users}
              color={planDistribution?.pro > 0 ? 'amber' : 'blue'}
              isLight={isLight}
              subtitle={planDistribution ? `${((planDistribution.standard / planDistribution.total) * 100).toFixed(0)}%` : ''}
            />
            <KpiCard
              label="Abonnés PRO"
              value={planLoading ? '…' : (planDistribution?.pro ?? 0)}
              icon={Users}
              color="emerald"
              isLight={isLight}
              subtitle={planDistribution ? `${((planDistribution.pro / planDistribution.total) * 100).toFixed(0)}%` : ''}
            />
            <KpiCard
              label="Abonnés PREMIUM"
              value={planLoading ? '…' : (planDistribution?.premium ?? 0)}
              icon={Crown}
              color="amber"
              isLight={isLight}
              subtitle={planDistribution ? `${((planDistribution.premium / planDistribution.total) * 100).toFixed(0)}%` : ''}
            />
          </div>

          {/* Row 4 : Graphiques + Top hotspots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenus par jour */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn('rounded-2xl p-5', cardCls)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn('text-sm font-bold', textPrimary)}>Revenus par jour</h3>
                <DollarSign className={cn('w-4 h-4', textMuted)} aria-hidden="true" />
              </div>
              {revData.length > 0 ? (
                <div>
                  <MiniBarChart data={revData} color="#F59E0B" isLight={isLight} />
                  <div className="flex justify-between mt-2">
                    <span className={cn('text-[10px]', textMuted)}>{revData[0]?.date || ''}</span>
                    <span className={cn('text-[10px]', textMuted)}>{revData[revData.length - 1]?.date || ''}</span>
                  </div>
                </div>
              ) : (
                <p className={cn('text-xs', textMuted)}>Aucune donnée de revenu pour cette période</p>
              )}
            </motion.div>

            {/* Sessions par jour */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn('rounded-2xl p-5', cardCls)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn('text-sm font-bold', textPrimary)}>Sessions par jour</h3>
                <Users className={cn('w-4 h-4', textMuted)} aria-hidden="true" />
              </div>
              {sessData.length > 0 ? (
                <div>
                  <MiniBarChart data={sessData} color="#3B82F6" isLight={isLight} />
                  <div className="flex justify-between mt-2">
                    <span className={cn('text-[10px]', textMuted)}>{sessData[0]?.date || ''}</span>
                    <span className={cn('text-[10px]', textMuted)}>{sessData[sessData.length - 1]?.date || ''}</span>
                  </div>
                </div>
              ) : (
                <p className={cn('text-xs', textMuted)}>Aucune donnée de session pour cette période</p>
              )}
            </motion.div>
          </div>

          {/* Row 5 : Top hotspots + Détails tickets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top hotspots */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn('rounded-2xl p-5 lg:col-span-1', cardCls)}
            >
              <h3 className={cn('text-sm font-bold mb-4', textPrimary)}>
                <span className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  Top hotspots (revenus)
                </span>
              </h3>
              {data.topHotspots?.length > 0 ? (
                <div className="space-y-3">
                  {data.topHotspots.map((h, i) => (
                    <div key={h.hotspotId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold',
                          i === 0 ? 'bg-amber-500/20 text-amber-400' : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400',
                        )}>
                          {i + 1}
                        </span>
                        <span className={cn('text-xs font-medium', textPrimary)}>{h.name}</span>
                      </div>
                      <span className={cn('text-xs font-semibold tabular-nums', textPrimary)}>
                        {formatXAF(h.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={cn('text-xs', textMuted)}>Aucun hotspot avec revenus</p>
              )}
            </motion.div>

            {/* Tickets status */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={cn('rounded-2xl p-5', cardCls)}
            >
              <h3 className={cn('text-sm font-bold mb-4', textPrimary)}>
                <span className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" aria-hidden="true" />
                  Statut des tickets
                </span>
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Disponibles', value: data.availableTickets ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                  { label: 'Utilisés', value: data.usedTickets ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { label: 'Expirés', value: data.expiredTickets ?? 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { label: 'Révoqués', value: data.revokedTickets ?? 0, color: 'text-red-400', bg: 'bg-red-500/10' },
                  { label: 'Total', value: data.totalTickets ?? 0, color: 'text-white', bg: 'bg-slate-700/50' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className={cn('text-xs', textSecondary)}>{item.label}</span>
                    <span className={cn('text-xs font-bold tabular-nums px-2 py-0.5 rounded-lg', item.color, item.bg)}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Stats rapides */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn('rounded-2xl p-5', cardCls)}
            >
              <h3 className={cn('text-sm font-bold mb-4', textPrimary)}>
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4" aria-hidden="true" />
                  Aperçu rapide
                </span>
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Plans créés', value: data.totalPlans ?? 0 },
                  { label: 'Total hotspots', value: data.totalHotspots ?? 0 },
                  { label: 'Hotspots en ligne', value: data.onlineHotspots ?? 0, sub: `${data.totalHotspots > 0 ? Math.round((data.onlineHotspots / data.totalHotspots) * 100) : 0}%` },
                  { label: 'Sessions actives', value: data.activeSessions ?? 0 },
                  { label: 'Retraits en attente', value: withdrawalLoading ? '…' : (withdrawalData?.pending ?? 0) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1">
                    <span className={cn('text-xs', textSecondary)}>{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-bold tabular-nums', textPrimary)}>{item.value}</span>
                      {item.sub && <span className={cn('text-[10px]', textMuted)}>({item.sub})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent payments table */}
          {(data.recentPayments?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className={cn('rounded-2xl overflow-hidden', cardCls)}
            >
              <div className={cn('px-5 py-4 border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                <h3 className={cn('text-sm font-bold', textPrimary)}>Derniers paiements</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                      <th className={cn('text-left px-5 py-3 font-semibold text-[10px] uppercase tracking-wide', textMuted)}>Hotspot</th>
                      <th className={cn('text-right px-5 py-3 font-semibold text-[10px] uppercase tracking-wide', textMuted)}>Montant</th>
                      <th className={cn('text-center px-5 py-3 font-semibold text-[10px] uppercase tracking-wide', textMuted)}>Statut</th>
                      <th className={cn('text-right px-5 py-3 font-semibold text-[10px] uppercase tracking-wide hidden md:table-cell', textMuted)}>Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {data.recentPayments.map((p, i) => (
                      <tr key={i} className={cn('transition-colors', isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30')}>
                        <td className={cn('px-5 py-3 font-medium', textPrimary)}>{p.hotspotName || p.hotspotId || '—'}</td>
                        <td className={cn('px-5 py-3 text-right font-semibold tabular-nums', textPrimary)}>{formatXAF(p.amount)}</td>
                        <td className="px-5 py-3 text-center"><StatusBadge status={p.status} isLight={isLight} /></td>
                        <td className={cn('px-5 py-3 text-right hidden md:table-cell', textSecondary)}>
                          {p.paidAt ? formatDateTime(p.paidAt) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
