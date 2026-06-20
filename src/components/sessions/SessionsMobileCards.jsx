import { Activity, Clock, XCircle, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { SessionStatusBadge } from '../ui/StatusBadge'
import { cn } from '../../utils/cn'
import { timeAgo } from '../../utils/format'

/**
 * SessionsMobileCards — Cartes mobiles pour les sessions
 *
 * Props :
 *  - sessions   : array
 *  - isLight    : boolean
 *  - textMuted  : string
 *  - onRevoke   : fn(sessionId)
 *  - revokingId : string | null
 *  - onDelete   : fn(sessionId)
 *  - deletingId : string | null
 */
export default function SessionsMobileCards({ sessions, isLight, textMuted, onRevoke, revokingId, onDelete, deletingId }) {
  return (
    <div className="space-y-2 sm:hidden">
      {sessions.map((s, i) => {
        const sid = s.id || s.sessionId
        return (
          <motion.div
            key={sid || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn('p-3.5 rounded-xl', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  s.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400'
                    : s.status === 'PENDING_MIKROTIK' ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-slate-800 text-slate-500')}>
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className={cn('text-xs font-semibold truncate', isLight ? 'text-slate-900' : 'text-white')}>
                    {s.username || s.mikrotikUsername || s.clientPhone || '—'}
                  </p>
                  <p className={cn('text-[10px] font-mono truncate', textMuted)}>
                    {s.clientMac || s.macAddress || s.ipAddress || ''}
                  </p>
                </div>
              </div>
              <SessionStatusBadge status={s.status || 'UNKNOWN'} />
            </div>

            <div className={cn('flex items-center gap-3 text-[10px]', textMuted)}>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {s.activatedAt || s.startedAt || s.created_at ? timeAgo(s.activatedAt || s.startedAt || s.created_at) : '—'}
              </div>
              {s.status === 'ACTIVE' && (
                <button onClick={() => onRevoke(sid)} disabled={revokingId === sid}
                  className={cn('ml-auto flex items-center gap-1 font-semibold disabled:opacity-50',
                    isLight ? 'text-red-500' : 'text-red-400')}>
                  <XCircle className="w-3 h-3" />
                  {revokingId === sid ? '...' : 'Révoquer'}
                </button>
              )}
              {(s.status === 'EXPIRED' || s.status === 'REVOKED') && (
                <button onClick={() => onDelete(sid)} disabled={deletingId === sid}
                  className={cn('ml-auto flex items-center gap-1 font-semibold disabled:opacity-50',
                    isLight ? 'text-slate-500' : 'text-slate-400')}>
                  <Trash2 className="w-3 h-3" />
                  {deletingId === sid ? '...' : 'Supprimer'}
                </button>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
