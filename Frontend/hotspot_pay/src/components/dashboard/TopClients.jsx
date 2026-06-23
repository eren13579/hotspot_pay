import { useState, useEffect, useMemo } from 'react'
import { Users, Smartphone, AlertCircle } from 'lucide-react'
import { sessionsApi } from '../../api/endpoints'
import { timeAgo } from '../../utils/format'
import { cn } from '../../utils/cn'

export default function TopClients({ hotspotId, isLight }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'

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

  const topClients = useMemo(() => {
    const count = {}
    sessions.forEach((s) => {
      const key = s.username || s.macAddress || s.mac || s.ipAddress || 'Inconnu'
      if (!count[key]) count[key] = { count: 0, lastSeen: null, mac: s.macAddress || s.mac || '' }
      count[key].count++
      const date = s.created_at || s.createdAt || s.startedAt
      if (date && (!count[key].lastSeen || date > count[key].lastSeen)) {
        count[key].lastSeen = date
      }
    })
    return Object.entries(count)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([name, info]) => ({ name, ...info }))
  }, [sessions])

  if (loading) {
    return (
      <div className={cn('rounded-2xl p-6', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800')}>
        <div className="animate-pulse space-y-3">
          <div className={cn('h-4 w-28 rounded', isLight ? 'bg-slate-100' : 'bg-slate-800')} />
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn('h-10 rounded-xl', isLight ? 'bg-slate-100' : 'bg-slate-800')} />
          ))}
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

  return (
    <div className={cn('rounded-2xl p-6', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800')}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isLight ? 'bg-blue-50' : 'bg-blue-500/10')}>
          <Users className={cn('w-4 h-4', isLight ? 'text-blue-600' : 'text-blue-400')} />
        </div>
        <div>
          <h3 className={cn('text-sm font-bold', textPrimary)}>Top clients</h3>
          <p className={cn('text-[10px]', textMuted)}>Appareils les plus actifs</p>
        </div>
      </div>

      {topClients.length === 0 ? (
        <div className={cn('flex flex-col items-center py-8 text-center', textMuted)}>
          <Smartphone className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-xs">Aucun client pour le moment</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topClients.map((client, i) => (
            <div key={client.name} className={cn(
              'flex items-center justify-between p-3 rounded-xl',
              isLight ? 'bg-slate-50' : 'bg-slate-800/30',
            )}>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={cn(
                  'w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0',
                  isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-700 text-slate-400',
                )}>
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className={cn('text-xs font-semibold truncate', textPrimary)}>{client.name}</p>
                  {client.lastSeen && (
                    <p className={cn('text-[10px]', textMuted)}>Vu {timeAgo(client.lastSeen)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={cn('text-xs font-bold', isLight ? 'text-blue-600' : 'text-blue-400')}>
                  {client.count}
                </span>
                <span className={cn('text-[10px]', textMuted)}>
                  session{client.count !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
