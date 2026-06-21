import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  Activity, Clock, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Router, Server, Users, Globe,
  Zap, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { monitoringApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'
import { formatDateTime, timeAgo } from '../../utils/format'
import EmptyState, { LoadingSkeleton, ErrorState } from '../../components/ui/EmptyState'

/* ─── Color maps ──────────────────────────────────────────── */
const STATUS_META = {
  PENDING:      { label: 'En attente',     color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: Clock },
  DELIVERED:    { label: 'Distribuée',     color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',     icon: Server },
  ACK_SUCCESS:  { label: 'Succès',         color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
  ACK_FAILED:   { label: 'Échec',          color: 'text-red-400 bg-red-500/10 border-red-500/20',         icon: XCircle },
  EXPIRED:      { label: 'Expirée',        color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',  icon: Clock },
}

const TYPE_ICONS = {
  CREATE_USER:  { icon: Users, label: 'Création utilisateur' },
  REMOVE_USER:  { icon: Users, label: 'Suppression utilisateur' },
  KICK_SESSION: { icon: Zap,   label: 'Déconnexion session' },
}

/* ─── KPI Card ────────────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, subtitle, color, isLight, trend }) {
  const colorMap = {
    amber:  isLight ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald:isLight ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue:   isLight ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    rose:   isLight ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    red:    isLight ? 'bg-red-50 text-red-600 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20',
    slate:  isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }
  const c = colorMap[color] || colorMap.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border p-4 transition-all duration-200',
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/50 border-slate-800 shadow-lg shadow-black/10',
      )}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', c)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
            trend >= 0
              ? isLight ? 'text-emerald-600 bg-emerald-50' : 'text-emerald-400 bg-emerald-500/10'
              : isLight ? 'text-red-600 bg-red-50' : 'text-red-400 bg-red-500/10',
          )}>
            {trend >= 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {Math.abs(trend).toFixed(0)}%
          </div>
        )}
      </div>
      <p className={cn('text-2xl font-black tracking-tight mb-0.5', isLight ? 'text-slate-900' : 'text-white')}>
        {value ?? '—'}
      </p>
      <p className={cn('text-[11px] font-medium', isLight ? 'text-slate-500' : 'text-slate-400')}>{label}</p>
      {subtitle && <p className={cn('text-[10px] mt-0.5', isLight ? 'text-slate-400' : 'text-slate-500')}>{subtitle}</p>}
    </motion.div>
  )
}

/* ─── Status Badge ────────────────────────────────────────── */
function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: Activity }

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border', meta.color)}>
      {meta.label}
    </span>
  )
}

/* ─── Type Badge ─────────────────────────────────────────── */
function TypeBadge({ type }) {
  const meta = TYPE_ICONS[type] || { icon: Activity, label: type }
  const Icon = meta.icon

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  )
}

/* ─── Section Header ──────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, subtitle, action, isLight }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <div className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center',
          isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400',
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className={cn('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>{title}</h3>
          {subtitle && <p className={cn('text-[10px]', isLight ? 'text-slate-400' : 'text-slate-500')}>{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button onClick={action.onClick}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors',
            isLight ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20',
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ════════════════════════════════════════════════════════════ */

export default function AdminMonitoringPage() {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const containerCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'

  // ── Data ──────────────────────────────────────────────────
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      if (!loading) { /* silent refresh */ }
      setError(null)
      const { data: res } = await monitoringApi.routerActions(50)
      if (res?.success && res?.data) {
        setData(res.data)
      } else {
        throw new Error(res?.message || 'Erreur de chargement')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Auto-refresh every 10s ──
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

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

  const counts = data?.counts || {}
  const summary = data?.summary || {}
  const recentActions = data?.recentActions || []
  const perHotspot = data?.perHotspot || []
  const totalActions = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center',
            isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400',
          )}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className={cn('text-xl font-black tracking-tight', textPrimary)}>Monitoring routeur</h1>
            <p className={cn('text-[11px]', textSecondary)}>
              File d'attente des actions routeur
              {totalActions > 0 && ` · ${totalActions} action${totalActions > 1 ? 's' : ''} au total`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors',
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : isLight ? 'text-slate-400 bg-slate-100' : 'text-slate-500 bg-slate-800',
            )}
          >
            <RefreshCw className={cn('w-3 h-3', autoRefresh && 'animate-spin')} />
            {autoRefresh ? 'Auto 10s' : 'Auto désactivé'}
          </button>
          <button onClick={fetchData} aria-label="Rafraîchir"
            className={cn(
              'flex items-center justify-center w-9 h-9 rounded-xl transition-colors',
              isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800',
            )}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && !loading && (
        <ErrorState error={error} onRetry={fetchData} isLight={isLight} title="Erreur de chargement" />
      )}

      {!error && (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="En attente"
              value={counts.PENDING ?? 0}
              icon={Clock}
              color="amber"
              isLight={isLight}
            />
            <KpiCard
              label="Échecs (ACK_FAILED)"
              value={counts.ACK_FAILED ?? 0}
              icon={XCircle}
              color="red"
              isLight={isLight}
            />
            <KpiCard
              label="Aujourd'hui"
              value={summary.totalToday ?? 0}
              icon={Activity}
              color="blue"
              isLight={isLight}
              subtitle={`${summary.totalLastHour ?? 0} la dernière heure`}
            />
            <KpiCard
              label="Taux d'erreur"
              value={summary.totalAcked > 0 ? `${summary.errorRate ?? 0}%` : '—'}
              icon={AlertTriangle}
              color={summary.errorRate > 10 ? 'red' : 'emerald'}
              isLight={isLight}
              subtitle={summary.avgDeliverySeconds ? `⏱ ~${summary.avgDeliverySeconds}s livraison` : 'Aucune donnée'}
            />
          </div>

          {/* ── Status Distribution ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-2xl border p-5', containerCls)}
          >
            <SectionHeader
              icon={Activity}
              title="Distribution par statut"
              subtitle={`${Object.keys(counts).length} statuts`}
              isLight={isLight}
            />
            <div className="flex flex-wrap gap-2">
              {Object.entries(counts).map(([status, count]) => {
                const meta = STATUS_META[status] || { label: status, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' }
                const percentage = totalActions > 0 ? ((count / totalActions) * 100).toFixed(1) : 0
                return (
                  <div key={status}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs',
                      isLight ? 'bg-white' : 'bg-slate-900/30',
                      meta.color,
                    )}
                  >
                    <span className="font-semibold">{count}</span>
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{meta.label}</span>
                    <span className={cn('text-[10px]', isLight ? 'text-slate-400' : 'text-slate-500')}>({percentage}%)</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* ── Recent Actions Table ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-2xl overflow-hidden', containerCls)}
          >
            <div className="p-4 pb-0">
              <SectionHeader
                icon={Router}
                title="Actions récentes"
                subtitle={`${recentActions.length} dernières actions`}
                isLight={isLight}
              />
            </div>

            {recentActions.length > 0 ? (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                        <Th isLight={isLight}>Date</Th>
                        <Th isLight={isLight}>Action</Th>
                        <Th isLight={isLight}>Hotspot</Th>
                        <Th isLight={isLight}>Utilisateur</Th>
                        <Th isLight={isLight}>Statut</Th>
                        <Th isLight={isLight}>Résultat</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActions.map((action, i) => (
                        <tr key={action.actionId || i}
                          className={cn(
                            'border-b transition-colors',
                            isLight ? 'border-slate-100 hover:bg-slate-50' : 'border-slate-800/50 hover:bg-slate-800/30',
                          )}
                        >
                          <Td>{formatDateTime(action.createdAt)}</Td>
                          <Td><TypeBadge type={action.actionType} /></Td>
                          <Td>
                            <span className="flex items-center gap-1.5">
                              <Globe className="w-3 h-3 text-slate-500" />
                              <span className="truncate max-w-[120px]">{action.hotspotName}</span>
                            </span>
                          </Td>
                          <Td><span className="font-mono text-[10px]">{action.username}</span></Td>
                          <Td><StatusBadge status={action.status} /></Td>
                          <Td>
                            {action.ackSuccess === true && (
                              <span className="text-emerald-400 text-[10px]">✅ Succès</span>
                            )}
                            {action.ackSuccess === false && (
                              <span className="text-red-400 text-[10px] flex items-center gap-1">
                                ❌ {action.ackError || 'Échec'}
                              </span>
                            )}
                            {action.ackSuccess === null && (
                              <span className={isLight ? 'text-slate-400 text-[10px]' : 'text-slate-500 text-[10px]'}>—</span>
                            )}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden divide-y divide-slate-800">
                  {recentActions.slice(0, 10).map((action, i) => (
                    <div key={action.actionId || i} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <TypeBadge type={action.actionType} />
                        <StatusBadge status={action.status} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Globe className="w-3 h-3 text-slate-500" />
                        <span className={textSecondary}>{action.hotspotName}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono text-slate-400">{action.username}</span>
                        <span className={textMuted}>{timeAgo(action.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-6">
                <EmptyState
                  title="Aucune action routeur"
                  message="Les actions apparaîtront ici lorsque des utilisateurs se connecteront via le portail WiFi."
                  isLight={isLight}
                />
              </div>
            )}
          </motion.div>

          {/* ── Per-Hotspot Breakdown ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-2xl overflow-hidden', containerCls)}
          >
            <div className="p-4 pb-0">
              <SectionHeader
                icon={Globe}
                title="Actions par hotspot"
                subtitle={`${perHotspot.length} hotspot${perHotspot.length > 1 ? 's' : ''}`}
                isLight={isLight}
              />
            </div>

            {perHotspot.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                      <Th isLight={isLight}>Hotspot</Th>
                      <Th isLight={isLight}>Total</Th>
                      <Th isLight={isLight}>En attente</Th>
                      <Th isLight={isLight}>Échecs</Th>
                      <Th isLight={isLight}>Dernière action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {perHotspot.map((hs, i) => (
                      <tr key={hs.hotspotId || i}
                        className={cn(
                          'border-b transition-colors',
                          isLight ? 'border-slate-100 hover:bg-slate-50' : 'border-slate-800/50 hover:bg-slate-800/30',
                        )}
                      >
                        <Td>
                          <span className="flex items-center gap-1.5 font-medium">
                            <Globe className="w-3 h-3 text-slate-500" />
                            {hs.hotspotName}
                          </span>
                        </Td>
                        <Td><span className="font-semibold">{hs.total}</span></Td>
                        <Td>
                          {hs.pending > 0 ? (
                            <span className="text-yellow-400 font-semibold">{hs.pending}</span>
                          ) : (
                            <span className={textMuted}>0</span>
                          )}
                        </Td>
                        <Td>
                          {hs.failed > 0 ? (
                            <span className="text-red-400 font-semibold">{hs.failed}</span>
                          ) : (
                            <span className={textMuted}>0</span>
                          )}
                        </Td>
                        <Td><span className={textMuted}>{hs.lastActionAt ? timeAgo(hs.lastActionAt) : '—'}</span></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={Globe}
                  title="Aucun hotspot"
                  message="Les hotspots avec des actions routeur apparaîtront ici."
                  isLight={isLight}
                />
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}

/* ─── Helper sub-components ───────────────────────────────── */
function Th({ children, isLight }) {
  return (
    <th className={cn(
      'px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider',
      isLight ? 'text-slate-500 bg-slate-50' : 'text-slate-400 bg-slate-900/50',
    )}>
      {children}
    </th>
  )
}

function Td({ children }) {
  return <td className="px-4 py-3">{children}</td>
}
