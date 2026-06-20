import { Activity, Clock, Zap, XCircle, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { SessionStatusBadge } from '../ui/StatusBadge'
import { cn } from '../../utils/cn'
import { timeAgo } from '../../utils/format'

/**
 * SessionsTable — Tableau desktop des sessions
 *
 * Props :
 *  - sessions    : array
 *  - isLight     : boolean
 *  - textMuted   : string
 *  - onRevoke    : fn(sessionId)
 *  - revokingId  : string | null
 *  - onDelete    : fn(sessionId)
 *  - deletingId  : string | null
 */
export default function SessionsTable({ sessions, isLight, textMuted, onRevoke, revokingId, onDelete, deletingId }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <caption className="sr-only">Liste des sessions WiFi</caption>
        <thead>
          <tr className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
            <Th isLight={isLight}>Client</Th>
            <Th isLight={isLight} className="hidden sm:table-cell">MAC / IP</Th>
            <Th isLight={isLight} className="hidden md:table-cell">Statut</Th>
            <Th isLight={isLight} className="hidden lg:table-cell">Démarrée</Th>
            <Th isLight={isLight} className="hidden lg:table-cell">Expire</Th>
            <Th isLight={isLight} className="hidden xl:table-cell">Data</Th>
            <Th isLight={isLight}><span className="sr-only">Action</span></Th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => (
            <SessionRow key={s.id || s.sessionId || i}
              session={s} index={i} isLight={isLight} textMuted={textMuted}
              onRevoke={onRevoke} revokingId={revokingId}
              onDelete={onDelete} deletingId={deletingId} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, className, isLight }) {
  return (
    <th className={cn(
      'px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider',
      isLight ? 'text-slate-400' : 'text-slate-500',
      className,
    )}>{children}</th>
  )
}

function SessionRow({ session: s, index, isLight, textMuted, onRevoke, revokingId, onDelete, deletingId }) {
  const sid = s.id || s.sessionId
  const formatBytes = (b) => {
    if (!b && b !== 0) return '—'
    const bytes = parseInt(b, 10)
    if (bytes === 0) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className={cn('border-b transition-colors', isLight ? 'border-slate-100 hover:bg-slate-50' : 'border-slate-800/50 hover:bg-slate-800/20')}
    >
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
            s.status === 'ACTIVE' ? (isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400')
              : s.status === 'PENDING_MIKROTIK' ? (isLight ? 'bg-yellow-50 text-yellow-600' : 'bg-yellow-500/10 text-yellow-400')
              : isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500')}>
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className={cn('text-xs font-semibold truncate max-w-32', isLight ? 'text-slate-900' : 'text-white')}>
              {s.username || s.mikrotikUsername || s.clientPhone || '—'}
            </p>
            <p className={cn('text-[10px]', textMuted)}>{s.clientPhone || ''}</p>
          </div>
        </div>
      </td>
      <td className={cn('px-3 py-3 text-xs font-mono hidden sm:table-cell', isLight ? 'text-slate-600' : 'text-slate-400')}>
        {s.clientMac || s.macAddress || s.ipAddress || '—'}
      </td>
      <td className="px-3 py-3 hidden md:table-cell">
        <SessionStatusBadge status={s.status || 'UNKNOWN'} />
      </td>
      <td className={cn('px-3 py-3 text-xs hidden lg:table-cell', isLight ? 'text-slate-600' : 'text-slate-400')}>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 shrink-0" />
          {s.activatedAt || s.startedAt || s.created_at ? timeAgo(s.activatedAt || s.startedAt || s.created_at) : '—'}
        </div>
      </td>
      <td className={cn('px-3 py-3 text-xs hidden lg:table-cell', isLight ? 'text-slate-600' : 'text-slate-400')}>
        {s.expiresAt ? timeAgo(s.expiresAt) : '—'}
      </td>
      <td className={cn('px-3 py-3 text-xs hidden xl:table-cell', isLight ? 'text-slate-600' : 'text-slate-400')}>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 shrink-0" />
          {formatBytes(s.bytesIn)} / {formatBytes(s.bytesOut)}
        </div>
      </td>
      <td className="px-3 py-3 text-right">
        {s.status === 'ACTIVE' && (
          <button onClick={() => onRevoke(sid)}
            disabled={revokingId === sid}
            className={cn('flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50',
              isLight ? 'text-red-500 hover:bg-red-50 border border-red-200' : 'text-red-400 hover:bg-red-500/10 border border-red-800/40')}>
            <XCircle className="w-3 h-3" />
            {revokingId === sid ? '...' : 'Révoquer'}
          </button>
        )}
        {(s.status === 'EXPIRED' || s.status === 'REVOKED') && (
          <button onClick={() => onDelete(sid)}
            disabled={deletingId === sid}
            className={cn('flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50',
              isLight ? 'text-slate-500 hover:bg-slate-100 border border-slate-200' : 'text-slate-400 hover:bg-slate-800 border border-slate-700')}>
            <Trash2 className="w-3 h-3" />
            {deletingId === sid ? '...' : 'Supprimer'}
          </button>
        )}
      </td>
    </motion.tr>
  )
}
