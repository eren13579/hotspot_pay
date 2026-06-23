import { useState, useEffect } from 'react'
import {
  Clock, Wifi, Ticket, Activity, CreditCard,
  AlertCircle,
} from 'lucide-react'
import { ticketsApi, sessionsApi, paymentsApi } from '../../api/endpoints'
import { timeAgo } from '../../utils/format'
import { cn } from '../../utils/cn'

const EVENT_ICONS = {
  session: Activity,
  ticket: Ticket,
  payment: CreditCard,
}

const EVENT_COLORS = {
  session: 'text-blue-400 bg-blue-500/10',
  ticket: 'text-emerald-400 bg-emerald-500/10',
  payment: 'text-amber-400 bg-amber-500/10',
}

function EventIcon({ type }) {
  const Icon = EVENT_ICONS[type] || Wifi
  return Icon
}

export default function AuditTimeline({ hotspotId, isLight }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      try {
        const [sessRes, tickRes, payRes] = await Promise.allSettled([
          sessionsApi.byHotspot(hotspotId),
          ticketsApi.list(hotspotId),
          paymentsApi.list(hotspotId),
        ])

        const allEvents = []

        const extractItems = (res, key) => {
          const raw = res.value?.data?.data || res.value?.data
          if (Array.isArray(raw)) return raw
          if (key && raw?.[key]) return raw[key]
          if (raw?.items) return raw.items
          if (raw?.content) return raw.content
          if (raw?.sessions) return raw.sessions
          if (raw?.tickets) return raw.tickets
          return []
        }

        const sessions = sessRes.status === 'fulfilled' ? extractItems(sessRes, 'sessions') : []
        const tickets = tickRes.status === 'fulfilled' ? extractItems(tickRes, 'tickets') : []
        const payments = payRes.status === 'fulfilled' ? extractItems(payRes, 'payments') : []

        sessions.forEach((s) => {
          const date = s.created_at || s.createdAt || s.startedAt
          if (date) {
            allEvents.push({
              id: `sess-${s.id || date}`,
              type: 'session',
              date,
              label: s.username || 'Session',
              detail: s.macAddress || s.ipAddress || `Session ${s.status || 'ACTIVE'}`,
              status: s.status,
            })
          }
        })

        tickets.slice(0, 20).forEach((t) => {
          const date = t.created_at || t.createdAt
          if (date) {
            allEvents.push({
              id: `tick-${t.id || date}`,
              type: 'ticket',
              date,
              label: t.code || t.ticketCode || 'Ticket',
              detail: t.status || 'Créé',
              status: t.status,
            })
          }
        })

        payments.slice(0, 20).forEach((p) => {
          const date = p.created_at || p.createdAt
          if (date) {
            allEvents.push({
              id: `pay-${p.id || date}`,
              type: 'payment',
              date,
              label: p.reference || p.paymentRef || 'Paiement',
              detail: `${p.method || p.paymentMethod || ''} - ${p.amount || 0}`,
              status: p.status,
            })
          }
        })

        allEvents.sort((a, b) => b.date.localeCompare(a.date))

        if (mounted) setEvents(allEvents.slice(0, 30))
      } catch {
        if (mounted) setError('Erreur de chargement')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetch()
    return () => { mounted = false }
  }, [hotspotId])

  if (loading) {
    return (
      <div className={cn('rounded-2xl p-6', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800')}>
        <div className="animate-pulse space-y-4">
          <div className={cn('h-4 w-36 rounded', isLight ? 'bg-slate-100' : 'bg-slate-800')} />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn('w-8 h-8 rounded-full', isLight ? 'bg-slate-100' : 'bg-slate-800')} />
              <div className="flex-1 space-y-1.5">
                <div className={cn('h-3 w-32 rounded', isLight ? 'bg-slate-100' : 'bg-slate-800')} />
                <div className={cn('h-2 w-20 rounded', isLight ? 'bg-slate-100' : 'bg-slate-800')} />
              </div>
            </div>
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
      <div className="flex items-center gap-2.5 mb-5">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isLight ? 'bg-rose-50' : 'bg-rose-500/10')}>
          <Clock className={cn('w-4 h-4', isLight ? 'text-rose-600' : 'text-rose-400')} />
        </div>
        <div>
          <h3 className={cn('text-sm font-bold', textPrimary)}>Activité récente</h3>
          <p className={cn('text-[10px]', textMuted)}>Sessions, tickets et paiements</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className={cn('flex flex-col items-center py-10 text-center', textMuted)}>
          <Clock className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-xs">Aucune activité récente</p>
        </div>
      ) : (
        <div className="relative">
          {/* Ligne verticale */}
          <div className={cn('absolute left-4 top-2 bottom-2 w-px', isLight ? 'bg-slate-200' : 'bg-slate-700')} />

          <div className="space-y-4">
            {events.map((event) => {
              const Icon = EventIcon(event.type)
              return (
                <div key={event.id} className="flex items-start gap-3 relative pl-10">
                  {/* Dot */}
                  <div className={cn(
                    'absolute left-2.5 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center',
                    EVENT_COLORS[event.type],
                  )}>
                    <Icon className="w-2.5 h-2.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-xs font-semibold truncate', textPrimary)}>
                        {event.label}
                      </p>
                      <span className={cn('text-[10px] shrink-0', textMuted)}>
                        {timeAgo(event.date)}
                      </span>
                    </div>
                    <p className={cn('text-[10px] mt-0.5 truncate', textMuted)}>
                      {event.detail}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
