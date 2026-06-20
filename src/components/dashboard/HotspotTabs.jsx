/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tag, Ticket, Activity, CreditCard,
  Zap,
  AlertTriangle, RefreshCw,
} from 'lucide-react'
import { hotspotPlansApi, ticketsApi, sessionsApi, paymentsApi } from '../../api/endpoints'
import { formatXAF, formatDateTime, timeAgo } from '../../utils/format'
import { cn } from '../../utils/cn'
import PlansTabContent from './PlansTabContent'

const PLAN_TABS = [
  { key: 'plans', label: 'Forfaits', icon: Tag, minPlan: 'STANDARD' },
  { key: 'tickets', label: 'Tickets', icon: Ticket, minPlan: 'STANDARD' },
  { key: 'sessions', label: 'Sessions', icon: Activity, minPlan: 'PRO' },
  { key: 'payments', label: 'Paiements', icon: CreditCard, minPlan: 'PRO' },
]

const PLAN_LEVEL = { STANDARD: 0, PRO: 1, PREMIUM: 2 }

function useLazyFetch(fn) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fetched, setFetched] = useState(false)

  const fetch = useCallback(async () => {
    if (fetched) return
    setLoading(true); setError(null)
    try {
      const { data: res } = await fn()
      setData(res?.data ?? res ?? null)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur')
    } finally {
      setLoading(false); setFetched(true)
    }
  }, [fetched]) // eslint-disable-line

  return { data, loading, error, fetched, fetch, reset: () => { setFetched(false); setData(null) } }
}

function Toggle({ active, onChange, options, isLight }) {
  return (
    <div className={cn(
      'flex items-center p-0.5 rounded-xl border overflow-x-auto',
      isLight ? 'border-slate-200 bg-white' : 'border-slate-700/50 bg-slate-900',
    )}>
      {options.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
            active === key
              ? 'bg-blue-600 text-white shadow-sm'
              : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white',
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{label.slice(0, 4)}</span>
        </button>
      ))}
    </div>
  )
}

function Badge({ status }) {
  const cls = status === 'ACTIVE' || status === 'SUCCESS' || status === 'AVAILABLE'
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : status === 'USED'
    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  return <span className={cn('inline-flex px-2 py-0.5 rounded-lg border text-[10px] font-medium', cls)}>{status}</span>
}

export default function HotspotTabs({ hotspotId, planType = 'STANDARD' }) {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'

  const userLevel = PLAN_LEVEL[planType] ?? 0
  const tabs = PLAN_TABS.filter((t) => PLAN_LEVEL[t.minPlan] <= userLevel)
  const [activeTab, setActiveTab] = useState(tabs[0]?.key)

  useEffect(() => {
    const filtered = PLAN_TABS.filter((t) => PLAN_LEVEL[t.minPlan] <= userLevel)
    if (!filtered.find((t) => t.key === activeTab)) {
      setActiveTab(filtered[0]?.key)
    }
  }, [planType]) // eslint-disable-line

  const plans = useLazyFetch(() => hotspotPlansApi.list(hotspotId))
  const tickets = useLazyFetch(() => ticketsApi.list(hotspotId))
  const sessions = useLazyFetch(() => sessionsApi.byHotspot(hotspotId))
  const payments = useLazyFetch(() => paymentsApi.list(hotspotId))

  const fetchers = { plans, tickets, sessions, payments }
  const tab = tabs.find((t) => t.key === activeTab) || tabs[0]
  const f = fetchers[activeTab]
  const TabIcon = tab?.icon

  if (!tab) return null

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="overflow-x-auto -mx-1 px-1">
        <Toggle options={tabs} active={activeTab} onChange={(k) => { setActiveTab(k); fetchers[k]?.fetch() }} isLight={isLight} />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'rounded-2xl p-5 border',
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800',
          )}
        >
          {!f.fetched && !f.loading ? (
            <div className="flex flex-col items-center py-12 text-center">
              <button
                onClick={f.fetch}
                className="flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                Charger les {tab.label.toLowerCase()}
              </button>
            </div>
          ) : f.loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn('h-12 rounded-xl', isLight ? 'bg-slate-100' : 'bg-slate-800')} />
              ))}
            </div>
          ) : f.error ? (
            <div className="flex flex-col items-center py-12 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
              <p className="text-xs text-slate-400 mb-4">{f.error}</p>
              <button onClick={f.fetch} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold">
                <RefreshCw className="w-3 h-3" />
                Réessayer
              </button>
            </div>
          ) : !f.data || (Array.isArray(f.data) && f.data.length === 0) ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-3', isLight ? 'bg-slate-100' : 'bg-slate-800')}>
                <TabIcon className="w-6 h-6 text-slate-500" />
              </div>
              <p className={cn('text-sm font-semibold mb-1', isLight ? 'text-slate-700' : 'text-slate-300')}>Aucun {tab.label.toLowerCase()}</p>
              <p className="text-xs text-slate-500">Ce hotspot n&apos;a pas encore de {tab.label.toLowerCase()}.</p>
            </div>
          ) : (
            <TabContent tab={activeTab} data={f.data} isLight={isLight} hotspotId={hotspotId} onRefresh={f.fetch} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function TabContent({ tab, data, isLight, hotspotId, onRefresh }) {
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'

  switch (tab) {
    case 'plans': {
      return <PlansTabContent hotspotId={hotspotId} data={data} isLight={isLight} onRefresh={onRefresh} />
    }

    case 'tickets': {
      const items = (() => {
        if (Array.isArray(data)) return data
        const tabKey = tab === 'sessions' ? 'sessions' : tab === 'tickets' ? 'tickets' : tab === 'payments' ? 'payments' : tab === 'plans' ? 'plans' : null
        if (tabKey && data?.[tabKey]) return data[tabKey]
        return data?.items ?? data?.content ?? []
      })()
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                <th className={cn('text-left px-3 py-2 font-semibold', textMuted)}>Code</th>
                <th className={cn('text-left px-3 py-2 font-semibold hidden sm:table-cell', textMuted)}>Statut</th>
                <th className={cn('text-left px-3 py-2 font-semibold hidden md:table-cell', textMuted)}>Créé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {items.map((t, i) => (
                <tr key={t.id || i}>
                  <td className="px-3 py-2.5">
                    <code className={cn('font-mono text-xs font-semibold', isLight ? 'text-slate-900' : 'text-white')}>{t.code || t.ticketCode || '—'}</code>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell"><Badge status={t.status || 'UNKNOWN'} /></td>
                  <td className={cn('px-3 py-2.5 hidden md:table-cell', textSecondary)}>{t.createdAt || t.created_at ? formatDateTime(t.createdAt || t.created_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    case 'sessions': {
      const items = (() => {
        if (Array.isArray(data)) return data
        const tabKey = tab === 'sessions' ? 'sessions' : tab === 'tickets' ? 'tickets' : tab === 'payments' ? 'payments' : tab === 'plans' ? 'plans' : null
        if (tabKey && data?.[tabKey]) return data[tabKey]
        return data?.items ?? data?.content ?? []
      })()
      return (
        <div className="space-y-2">
          {items.map((s, i) => (
            <div key={s.id || i} className={cn('flex items-center justify-between p-3.5 rounded-xl', isLight ? 'bg-slate-50' : 'bg-slate-800/30')}>
              <div className="flex items-center gap-3 min-w-0">
                <Activity className={cn('w-4 h-4 shrink-0', s.status === 'ACTIVE' ? 'text-emerald-400' : 'text-slate-500')} />
                <div className="min-w-0">
                  <p className={cn('text-xs font-semibold truncate', isLight ? 'text-slate-900' : 'text-white')}>{s.username || '—'}</p>
                  <p className={cn('text-[10px]', textMuted)}>{s.macAddress || s.ipAddress || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn('text-[10px]', textSecondary)}>{s.startedAt || s.created_at ? timeAgo(s.startedAt || s.created_at) : ''}</span>
                <Badge status={s.status || 'UNKNOWN'} />
              </div>
            </div>
          ))}
        </div>
      )
    }

    case 'payments': {
      const items = (() => {
        if (Array.isArray(data)) return data
        const tabKey = tab === 'sessions' ? 'sessions' : tab === 'tickets' ? 'tickets' : tab === 'payments' ? 'payments' : tab === 'plans' ? 'plans' : null
        if (tabKey && data?.[tabKey]) return data[tabKey]
        return data?.items ?? data?.content ?? []
      })()
      return (
        <div className="space-y-2">
          {items.map((p, i) => (
            <div key={p.id || i} className={cn('flex items-center justify-between p-3.5 rounded-xl', isLight ? 'bg-slate-50' : 'bg-slate-800/30')}>
              <div className="flex items-center gap-3 min-w-0">
                <CreditCard className={cn('w-4 h-4 shrink-0', p.status === 'SUCCESS' ? 'text-emerald-400' : 'text-slate-500')} />
                <div className="min-w-0">
                  <p className={cn('text-xs font-semibold truncate', isLight ? 'text-slate-900' : 'text-white')}>{p.reference || p.paymentRef || '—'}</p>
                  <p className={cn('text-[10px]', textMuted)}>{p.method || p.paymentMethod || ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-emerald-400">{formatXAF(p.amount || 0)}</span>
                <Badge status={p.status || 'UNKNOWN'} />
              </div>
            </div>
          ))}
        </div>
      )
    }

    default:
      return null
  }
}
