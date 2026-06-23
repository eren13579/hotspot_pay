/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-undef */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useSelector } from 'react-redux'
import {
  Wifi, CreditCard, TrendingUp,
  ArrowRight, RefreshCw, Activity,
  Users,
  Receipt, Download,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { dashboardApi, hotspotsApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { makeHotspotSlug, storeSlugMapping } from '../../utils/slug'
import { usePlan } from '../../hooks/usePlan'
import { formatXAF } from '../../utils/format'
import { cn } from '../../utils/cn'
import { ConnectivityPulse } from '../../components/ui'
import { ScopeToggle, StatsCardGrid, LoadingSkeleton, ErrorState, EmptyState, Pagination } from '../../components/ui'
import PeriodFilter from '../../components/dashboard/PeriodFilter'
import RevenueChart from '../../components/dashboard/RevenueChart'
import SessionsChart from '../../components/dashboard/SessionsChart'
import TicketDonut from '../../components/dashboard/TicketDonut'
import TopHotspotsList, { UpgradeCTA } from '../../components/dashboard/TopHotspotsList'
import RecentPayments from '../../components/dashboard/RecentPayments'
import NetworkErrorBanner from '../../components/dashboard/NetworkErrorBanner'

/* ============================================
   CONSTANTES
   ============================================ */
const ROWS_PER_PAGE = 7

export function buildPeriodQuery(period) {
  const now = new Date()
  const fmt = (d) => d.toISOString().slice(0, 10)
  switch (period) {
    case 'today':  return { startDate: fmt(now), endDate: fmt(now) }
    case '7d':     { const d = new Date(now); d.setDate(d.getDate() - 7); return { startDate: fmt(d), endDate: fmt(now) } }
    case '30d':    { const d = new Date(now); d.setDate(d.getDate() - 30); return { startDate: fmt(d), endDate: fmt(now) } }
    case '90d':    { const d = new Date(now); d.setDate(d.getDate() - 90); return { startDate: fmt(d), endDate: fmt(now) } }
    case 'year':   { const d = new Date(now.getFullYear(), 0, 1); return { startDate: fmt(d), endDate: fmt(now) } }
    default: return { startDate: '', endDate: '' }
  }
}

export const PERIOD_LABELS = {
  today: "Aujourd'hui", '7d': '7 jours', '30d': '30 jours', '90d': '90 jours', year: 'Cette année', custom: 'Période',
}

const STATS_CONFIG = [
  { key: 'totalHotspots', label: 'Hotspots', icon: Wifi, color: 'from-blue-600 to-blue-400', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  { key: 'activeSessions', label: 'Sessions actives', icon: Activity, color: 'from-emerald-600 to-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  { key: 'revenueThisMonth', label: 'Ce mois-ci', icon: CreditCard, color: 'from-amber-500 to-amber-300', bg: 'bg-amber-500/10', text: 'text-amber-300', fmt: formatXAF },
  { key: 'totalRevenue', label: 'Revenu total', icon: TrendingUp, color: 'from-amber-600 to-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-500', fmt: formatXAF },
]

const TICKET_COLORS = ['#06b6d4', '#22c55e', '#f59e0b', '#ef4444']

const statusColor = (status) => ({
  ONLINE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  OFFLINE: 'text-red-400 bg-red-500/10 border-red-500/20',
  NEVER: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  NO_TOKEN: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
}[status] || 'text-slate-400 bg-slate-500/10 border-slate-500/20')

const statusLabel = (status) => ({
  ONLINE: 'En ligne', OFFLINE: 'Hors ligne', NEVER: 'Jamais connecté', NO_TOKEN: 'Non configuré',
}[status] || status)

const statusDot = (status) => {
  if (status === 'ONLINE') return <ConnectivityPulse active size="sm" />
  if (status === 'OFFLINE') return <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
  return <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
}

/* ============================================
   PAGE
   ============================================ */
export default function DashboardPage() {
  const navigate = useNavigate()
  const theme = useSelector((state) => state.ui.theme)
  const searchQuery = useSelector((state) => state.ui.searchQuery)
  const { user, role } = useAuth()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const { showTicketDonut, showTopHotspots, showPlansKpi, allowedPeriods, needsUpgrade, showExport } = usePlan()

  const [period, setPeriod] = useState({ period: 'today', startDate: '', endDate: '' })
  const [scope, setScope] = useState('global')
  const [overview, setOverview] = useState(null)
  const [hotspots, setHotspots] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [networkError, setNetworkError] = useState(null)
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(totalElements / ROWS_PER_PAGE))

  const isLight = theme === 'light'
  const uid = user?.userId || ''
  const containerCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  const goToHotspot = useCallback((h) => {
    const hid = h.hotspot_id || h.id
    const slug = makeHotspotSlug(h)
    if (slug) storeSlugMapping(slug, hid)
    navigate(`/dashboard/hotspots/${slug}`)
  }, [navigate])

  /* ── Filtres ────────────────────────────────── */
  const filteredHotspots = useMemo(() => {
    if (!searchQuery) return hotspots
    const q = searchQuery.toLowerCase()
    return hotspots.filter((h) =>
      (h.name || '').toLowerCase().includes(q) ||
      (h.mikrotik_ip || '').toLowerCase().includes(q) ||
      (h.location || '').toLowerCase().includes(q))
  }, [hotspots, searchQuery])

  const prevKey = useRef('')
  useEffect(() => {
    const key = `${period.period}|${scope}`
    if (prevKey.current && prevKey.current !== key) setPage(0)
    prevKey.current = key
  }, [period, scope])

  /* ── Fetch ──────────────────────────────────── */
  const fetchDataRef = useRef()
  const hasDataRef = useRef(false)

  const fetchData = useCallback(async (isAutoRefresh = false) => {
    const startTime = Date.now()
    try {
      if (!isAutoRefresh) { if (!hasDataRef.current) setLoading(true); else setRefreshing(true); setError(null) }
      setNetworkError(null)

      const periodQuery = buildPeriodQuery(period.period)
      if (period.period === 'custom' && period.startDate) {
        periodQuery.startDate = period.startDate
        periodQuery.endDate = period.endDate || period.startDate
      }

      const isGlobal = isAdmin && scope === 'global'

      const [overviewRes, hotspotsRes] = await Promise.all([
        isGlobal ? dashboardApi.adminOverview(periodQuery).catch(() => null) : dashboardApi.overview(uid, periodQuery).catch(() => null),
        isGlobal ? hotspotsApi.adminList(page, ROWS_PER_PAGE).catch(() => null) : hotspotsApi.list(uid, page, ROWS_PER_PAGE, 'self').catch(() => null),
      ])

      if (overviewRes?.data?.success) { setOverview(overviewRes.data.data); hasDataRef.current = true }
      else if (!isGlobal && overviewRes?.data?.data) { setOverview(overviewRes.data.data); hasDataRef.current = true }
      else if (!isAutoRefresh) setOverview(null)

      if (hotspotsRes?.data?.success) {
        const data = hotspotsRes.data.data; const list = data?.content || data || []
        setHotspots(Array.isArray(list) ? list : [])
        const total = data?.page?.totalElements ?? data?.totalElements ?? list.length
        setTotalElements(total)
        if (list.length > 0) hasDataRef.current = true
      } else if (hotspotsRes?.data?.data?.content) {
        const data = hotspotsRes.data.data
        setHotspots(data.content); setTotalElements(data?.page?.totalElements ?? data.totalElements ?? data.content.length)
        if (data.content?.length > 0) hasDataRef.current = true
      } else if (!isAutoRefresh) { setHotspots([]); setTotalElements(0) }
    } catch (err) {
      const msg = err.message === 'Network Error'
        ? 'Connexion au serveur impossible. Vérifiez votre réseau.'
        : (err.response?.data?.message || err.message || 'Erreur réseau')
      if (hasDataRef.current) { setNetworkError(msg); toast.error(msg, { duration: 5000 }) }
      else setError(msg)
    } finally {
      setLoading(false)
      const elapsed = Date.now() - startTime
      if (elapsed < 600) setTimeout(() => setRefreshing(false), 600 - elapsed)
      else setRefreshing(false)
    }
  }, [uid, period, scope, page, isAdmin])

  useEffect(() => { fetchDataRef.current = fetchData }, [fetchData])
  useEffect(() => { if (!uid) return; const id = setInterval(() => fetchDataRef.current?.(true), 30000); return () => clearInterval(id) }, [uid])
  useEffect(() => { if (uid) fetchData() }, [uid, period, scope, fetchData])

  /* ── Derived data ───────────────────────────── */
  const chartData = useMemo(() => {
    if (!overview) return []
    if (overview.revenueByDay?.length) return overview.revenueByDay.map((d) => ({ name: d.date?.slice(5, 10) || d.label || d.name, revenue: d.revenue || d.amount || 0 }))
    if (overview.revenueByMonth?.length) return overview.revenueByMonth.map((d) => ({ name: d.label || d.month || d.name, revenue: d.revenue || d.amount || 0 }))
    return [{ name: PERIOD_LABELS[period.period] || "Aujourd'hui", revenue: overview.revenueToday || 0 }]
  }, [overview, period.period])

  const revenueGrowth = useMemo(() => {
    if (!overview) return null
    const current = overview.currentPeriodRevenue ?? 0; const previous = overview.previousPeriodRevenue ?? 0
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }, [overview])

  const sessionsChartData = useMemo(() => {
    if (!overview?.sessionsByDay?.length) return []
    return overview.sessionsByDay.map((d) => ({ name: d.date?.slice(5, 10) || '—', sessions: d.sessions || 0 }))
  }, [overview])

  const ticketPieData = useMemo(() => {
    if (!overview) return []
    return [
      { name: 'Disponibles', value: overview.availableTickets || 0, color: TICKET_COLORS[0] },
      { name: 'Utilisés', value: overview.usedTickets || 0, color: TICKET_COLORS[1] },
      { name: 'Expirés', value: overview.expiredTickets || 0, color: TICKET_COLORS[2] },
      { name: 'Révoqués', value: overview.revokedTickets || 0, color: TICKET_COLORS[3] },
    ].filter(d => d.value > 0)
  }, [overview])

  const exportCSV = () => {
    if (!overview) return
    const rows = [['Métrique', 'Valeur']]
    rows.push(['Hotspots', overview.totalHotspots ?? 0], ['Sessions actives', overview.activeSessions ?? 0])
    rows.push(['Revenu total', overview.totalRevenue ?? 0], ['Revenu du mois', overview.revenueThisMonth ?? 0], ['Revenu période', overview.revenueToday ?? 0])
    rows.push(['Tickets total', overview.totalTickets ?? 0], ['Disponibles', overview.availableTickets ?? 0], ['Utilisés', overview.usedTickets ?? 0], ['Expirés', overview.expiredTickets ?? 0], ['Révoqués', overview.revokedTickets ?? 0])
    rows.push(['Forfaits', overview.totalPlans ?? 0])
    if (overview.totalUsers != null) rows.push(['Utilisateurs', overview.totalUsers])
    if (overview.topHotspots?.length) { rows.push([]); rows.push(['--- Top hotspots ---', 'Revenu']); overview.topHotspots.forEach((h) => rows.push([`#${h.name || h.hotspotId}`, h.revenue ?? 0])) }
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `dashboard-hotspotpay-${period.period}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  /* ── States ─────────────────────────────────── */
  if (loading) return <LoadingSkeleton rows={6} isLight={isLight} />

  if (error) return <ErrorState error={error} onRetry={fetchData} isLight={isLight} />

  if (!loading && !error && hotspots.length === 0) {
    return (
      <EmptyState
        title="Bienvenue sur HotspotPay !"
        message={isAdmin ? 'Aucun hotspot sur la plateforme pour le moment.' : "Vous n'avez pas encore de hotspot. Créez votre premier hotspot WiFi pour commencer à générer des revenus."}
        action={!isAdmin ? { label: 'Créer mon premier hotspot', onClick: () => navigate('/onboarding') } : null}
        isLight={isLight}
      />
    )
  }

  /* ── Quick insights panel ───────────────────── */
  const quickInsights = (
    <div className={cn('rounded-2xl p-6', containerCls)}>
      <h3 className={cn('text-sm font-bold mb-4', textPrimary)}>Aperçu rapide</h3>
      <div className="space-y-3">
        {[
          { label: 'Hotspots', val: `${overview?.onlineHotspots || 0}/${overview?.totalHotspots || 0}`, sub: 'Sessions', subVal: overview?.activeSessions || 0, icon: Wifi, iconBg: 'bg-blue-500/10', iconCls: 'text-blue-400', cls: overview?.activeSessions > 0 ? 'text-emerald-400' : textMuted },
          { label: 'Tickets', val: overview?.totalTickets?.toLocaleString('fr-FR') || 0, sub: 'Disponibles', subVal: overview?.availableTickets?.toLocaleString('fr-FR') || 0, icon: Receipt, iconBg: 'bg-cyan-500/10', iconCls: 'text-cyan-400', cls: textPrimary },
          { label: 'Ce mois-ci', val: formatXAF(overview?.revenueThisMonth || 0), sub: 'Total', subVal: formatXAF(overview?.totalRevenue || 0), icon: CreditCard, iconBg: 'bg-blue-500/10', iconCls: 'text-blue-400', cls: textPrimary },
        ].map((item, i) => (
          <div key={i} className={cn('flex items-center justify-between p-3 rounded-xl', isLight ? 'bg-slate-50' : 'bg-slate-800/30')}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                <item.icon className={`w-4 h-4 ${item.iconCls}`} />
              </div>
              <div>
                <p className={cn('text-[11px] font-medium', textMuted)}>{item.label}</p>
                <p className={cn('text-sm font-bold', textPrimary)}>{item.val}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn('text-[11px] font-medium', textMuted)}>{item.sub}</p>
              <p className={cn('text-sm font-bold', item.cls)}>{item.subVal}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  /* ── Main render ────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className={cn('text-xl font-bold tracking-tight', textPrimary)}>
            {isAdmin ? 'Dashboard administrateur' : `Bonjour${user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}`}
          </h1>
          <p className={cn('text-xs mt-0.5', textSecondary)}>
            {isAdmin ? (scope === 'global' ? 'Vue globale — tous les utilisateurs.' : 'Vue personnelle — vos données.') : 'Voici le résumé de votre activité.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <ScopeToggle scope={scope} onChange={setScope} isLight={isLight} />}
          {showExport && overview && (
            <button onClick={exportCSV} className={cn('flex items-center gap-1.5 h-9 px-3 rounded-xl text-[11px] font-medium transition-all', isLight ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200 bg-white' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-700/50 bg-slate-900')}>
              <Download className="w-3 h-3" /> Export
            </button>
          )}
          <PeriodFilter theme={theme} value={period} onChange={setPeriod} allowedKeys={allowedPeriods} />
          <button onClick={() => fetchData()} className={cn('flex items-center gap-1.5 h-9 px-3 rounded-xl text-[11px] font-medium transition-all', isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white' : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50 bg-slate-900')}>
            <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} /> Actualiser
          </button>
        </div>
      </div>

      {/* ── Network error ──────────────────────── */}
      {networkError && <NetworkErrorBanner message={networkError} onClose={() => setNetworkError(null)} isLight={isLight} />}

      {/* ── Stats cards ────────────────────────── */}
      <StatsCardGrid
        stats={[
          ...STATS_CONFIG.filter(s => s.key !== 'totalPlans' || showPlansKpi),
          ...(isAdmin && scope === 'global'
            ? [{ key: 'totalUsers', label: 'Utilisateurs', icon: Users, color: 'from-blue-600 to-blue-400', bg: 'bg-blue-500/10', text: 'text-blue-400' }]
            : []),
        ]}
        overview={overview}
        isLight={isLight}
        periodLabel={PERIOD_LABELS[period.period] || "Aujourd'hui"}
      />

      {/* ── Revenue chart + Quick insights ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart chartData={chartData} revenueGrowth={revenueGrowth} isLight={isLight} containerCls={containerCls} />
        </div>
        {quickInsights}
      </div>

      {/* ── Sessions chart ─────────────────────── */}
      {sessionsChartData.length > 0 && (
        <SessionsChart chartData={sessionsChartData} activeSessions={overview?.activeSessions} isLight={isLight} containerCls={containerCls} />
      )}

      {/* ── Ticket donut + Top hotspots ou Upgrade CTA ── */}
      {showTicketDonut || showTopHotspots ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {showTicketDonut && <TicketDonut data={ticketPieData} isLight={isLight} containerCls={containerCls} />}
          {showTopHotspots && <TopHotspotsList hotspots={overview?.topHotspots} isLight={isLight} containerCls={containerCls} />}
        </div>
      ) : needsUpgrade && <UpgradeCTA onNavigate={() => navigate('/dashboard/subscriptions')} isLight={isLight} containerCls={containerCls} />}

      {/* ── Recent payments ────────────────────── */}
      <RecentPayments payments={overview?.recentPayments} isLight={isLight} containerCls={containerCls} />

      {/* ── Hotspots table ──────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className={cn('rounded-2xl overflow-hidden', containerCls)}>
        <div className={cn('flex items-center justify-between px-6 py-4 border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
          <h3 className={cn('text-sm font-bold', textPrimary)}>Hotspots {searchQuery ? `(${filteredHotspots.length}/${hotspots.length})` : `(${hotspots.length})`}</h3>
          <button onClick={() => navigate('/dashboard/hotspots')} className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors">
            Voir tout <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {filteredHotspots.length === 0 ? (
          <NoSearchResults query={searchQuery} isLight={isLight} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={cn('border-b', isLight ? 'border-slate-100' : 'border-slate-800')}>
                    <th className={cn('text-left px-6 py-3 font-semibold', textMuted)}>Nom</th>
                    <th className={cn('text-left px-6 py-3 font-semibold hidden sm:table-cell', textMuted)}>IP</th>
                    <th className={cn('text-left px-6 py-3 font-semibold hidden md:table-cell', textMuted)}>Localisation</th>
                    <th className={cn('text-left px-6 py-3 font-semibold', textMuted)}>Statut</th>
                    <th className={cn('text-right px-6 py-3 font-semibold', textMuted)}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredHotspots.map((h, i) => (
                    <tr key={h.hotspot_id || h.id || i} className={cn('transition-colors cursor-pointer', isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/20')} onClick={() => goToHotspot(h)}>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isLight ? 'bg-blue-50' : 'bg-blue-500/10')}>
                            <Wifi className={cn('w-3.5 h-3.5', isLight ? 'text-blue-600' : 'text-blue-400')} />
                          </div>
                          <span className={cn('font-semibold', textPrimary)}>{h.name || 'Sans nom'}</span>
                        </div>
                      </td>
                      <td className={cn('px-6 py-3.5 hidden sm:table-cell font-mono', textSecondary)}>{h.mikrotik_ip || '—'}</td>
                      <td className={cn('px-6 py-3.5 hidden md:table-cell', textSecondary)}>{h.location || '—'}</td>
                      <td className="px-6 py-3.5">
                        <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-medium', statusColor(h.status))}>
                          {statusDot(h.status)}
                          {statusLabel(h.status)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button onClick={(e) => { e.stopPropagation(); goToHotspot(h) }} className={cn('text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all', isLight ? 'text-blue-600 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-500/10')}>Détails</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onChange={setPage} isLight={isLight} />
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
