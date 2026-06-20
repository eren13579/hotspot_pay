import { motion } from 'framer-motion'
import { Ban, Trash2, EyeOff, Eye } from 'lucide-react'
import { cn } from '../../utils/cn'
import { TICKET_STATUS_STYLE, TICKET_STATUS_LABEL } from '../ui/StatusBadge'

/**
 * TicketsMobileCards — Vue mobile en cartes des tickets
 *
 * Props : identiques à TicketsTable
 */
export default function TicketsMobileCards({
  tickets, isLight, canBulkManage,
  selectedIds, onToggleSelect,
  revealedIds, onToggleReveal, onRevoke, onDelete,
}) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className="md:hidden divide-y divide-slate-800/30">
      {tickets.map((t, i) => {
        const tid = t.ticket_id || t.id
        const checked = selectedIds.has(tid)
        const isRevealed = revealedIds.has(tid)
        return (
          <motion.div
            key={tid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            className={cn(
              'p-4 transition-all',
              checked ? (isLight ? 'bg-blue-50/60' : 'bg-blue-500/5') : '',
            )}
          >
            <div className="flex items-start gap-3">
              {canBulkManage && (
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleSelect(tid)}
                  className="accent-blue-600 w-4 h-4 mt-1 cursor-pointer shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('font-semibold font-mono text-sm', textPrimary)}>
                    {t.username || '—'}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-lg border text-[10px] font-medium',
                    TICKET_STATUS_STYLE[t.status] || 'text-slate-400 bg-slate-500/10 border-slate-500/20',
                  )}>
                    {TICKET_STATUS_LABEL[t.status] || t.status || 'INCONNU'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div className={textMuted}>
                    Mot de passe :{' '}
                    <span className={cn('font-mono', textSecondary)}>
                      {isRevealed ? (t.password || '—') : (t.password ? '•'.repeat(Math.min(t.password.length, 8)) : '—')}
                    </span>
                    {t.password && (
                      <button onClick={() => onToggleReveal(tid)} className="ml-1 align-middle">
                        {isRevealed
                          ? <EyeOff className={cn('w-3 h-3 inline', textMuted)} />
                          : <Eye className={cn('w-3 h-3 inline', textMuted)} />
                        }
                      </button>
                    )}
                  </div>
                  <div className={textMuted}>Profil : <span className={textSecondary}>{t.profile || 'default'}</span></div>
                  <div className={textMuted}>Durée : <span className={textSecondary}>{t.time_limit || 'Illimité'}</span></div>
                  <div className={textMuted}>Data : <span className={textSecondary}>{t.data_limit ? `${t.data_limit} MB` : '—'}</span></div>
                </div>
              </div>
              {t.status === 'AVAILABLE' && (
                <button
                  onClick={() => onRevoke(tid)}
                  className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all',
                    isLight ? 'text-amber-600 hover:bg-amber-50' : 'text-amber-400 hover:bg-amber-500/10',
                  )}
                >
                  <Ban className="w-3.5 h-3.5" />
                </button>
              )}
              {t.status === 'REVOKED' && (
                <button
                  onClick={() => onDelete(tid)}
                  className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all',
                    isLight ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10',
                  )}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
