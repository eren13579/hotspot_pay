import { useState, useEffect, useMemo } from 'react'
import {
   XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts'
import { Activity, AlertCircle } from 'lucide-react'
import { sessionsApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'

export default function ActivityChart({ hotspotId, isLight }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      try {
        const { data } = await sessionsApi.byHotspot(hotspotId)
        const raw = data?.data
        let items = []
        if (Array.isArray(raw)) items = raw
        else if (raw?.sessions) items = raw.sessions
        else if (raw?.items) items = raw.items
        else if (raw?.content) items = raw.content
        if (mounted) setSessions(items)
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || err.message || 'Erreur')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetch()
    return () => { mounted = false }
  }, [hotspotId])

  const chartData = useMemo(() => {
    const dayMap = {}
    sessions.forEach((s) => {
      const date = s.created_at || s.createdAt || s.startedAt
      if (!date) return
      const day = date.slice(0, 10)
      dayMap[day] = (dayMap[day] || 0) + 1
    })
    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({
        date: date.slice(5),
        sessions: count,
      }))
  }, [sessions])

  if (loading) {
    return (
      <div className={cn('rounded-2xl p-6', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800')}>
        <div className="animate-pulse space-y-4">
          <div className={cn('h-4 w-32 rounded', isLight ? 'bg-slate-100' : 'bg-slate-800')} />
          <div className={cn('h-48 rounded-xl', isLight ? 'bg-slate-100' : 'bg-slate-800')} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('rounded-2xl p-6', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800')}>
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      </div>
    )
  }

  const hasData = chartData.length > 0

  return (
    <div className={cn('rounded-2xl p-6', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800')}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isLight ? 'bg-blue-50' : 'bg-blue-500/10')}>
          <Activity className={cn('w-4 h-4', isLight ? 'text-blue-600' : 'text-blue-400')} />
        </div>
        <div>
          <h3 className={cn('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>Activité</h3>
          <p className={cn('text-[10px]', textMuted)}>Connexions par jour (14 derniers jours)</p>
        </div>
      </div>

      {!hasData ? (
        <div className={cn('flex flex-col items-center py-10 text-center', textMuted)}>
          <Activity className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-xs">Aucune activité récente</p>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: isLight ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: isLight ? '#94a3b8' : '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isLight ? '#fff' : '#1e293b',
                  border: `1px solid ${isLight ? '#e2e8f0' : '#334155'}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: isLight ? '#0f172a' : '#fff' }}
              />
              <Area type="monotone" dataKey="sessions" stroke="#f59e0b" fill="url(#colorSessions)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
