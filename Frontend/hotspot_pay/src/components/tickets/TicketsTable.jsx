import { motion } from 'framer-motion'
import { User, Ticket, Clock, HardDrive, Ban, Trash2, EyeOff, Eye } from 'lucide-react'
import { cn } from '../../utils/cn'
import { TICKET_STATUS_STYLE, TICKET_STATUS_LABEL } from '../ui/StatusBadge'

/**
 * TicketsTable — Tableau desktop des tickets
 *
 * Props :
 *  - tickets         : array (requis)
 *  - isLight         : boolean (requis)
 *  - canBulkManage   : boolean (requis)
 *  - selectedIds     : Set (requis)
 *  - onToggleSelect  : fn(id) (requis)
 *  - allChecked      : boolean (requis)
 *  - onToggleSelectAll : fn() (requis)
 *  - revealedIds     : Set (requis)
 *  - onToggleReveal  : fn(id) (requis)
 *  - onRevoke        : fn(id) (requis)
 *  - onDelete        : fn(id) (requis)
 */
export default function TicketsTable({
  tickets, isLight, canBulkManage,
  selectedIds, onToggleSelect, allChecked, onToggleSelectAll,
  revealedIds, onToggleReveal, onRevoke, onDelete,
}) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  /** Format court JJ/MM HH:mm */
  const fmtDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' +
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } catch { return '—' }
  }

  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
            {canBulkManage && (
              <th className="w-10 px-4 py-4">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={onToggleSelectAll}
                  className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
            )}
            <th className={cn('text-left px-4 py-4 font-semibold', textMuted)}>
              <span className="flex items-center gap-1.5"><User className="w-3 h-3" />Username</span>
            </th>
            <th className={cn('text-left px-4 py-4 font-semibold', textMuted)}>
              <span className="flex items-center gap-1.5"><Ticket className="w-3 h-3" />Mot de passe</span>
            </th>
            <th className={cn('text-left px-4 py-4 font-semibold', textMuted)}>Profil</th>
            <th className={cn('text-left px-4 py-4 font-semibold', textMuted)}>Statut</th>
            <th className={cn('text-left px-4 py-4 font-semibold hidden lg:table-cell', textMuted)}>
              <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />Durée</span>
            </th>
            <th className={cn('text-left px-4 py-4 font-semibold hidden xl:table-cell', textMuted)}>
              <span className="flex items-center gap-1.5"><HardDrive className="w-3 h-3" />Data</span>
            </th>
            <th className={cn('text-left px-4 py-4 font-semibold hidden xl:table-cell', textMuted)}>Créé le</th>
            <th className={cn('text-right px-4 py-4 font-semibold', textMuted)}>Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/30">
          {tickets.map((t, i) => {
            const tid = t.ticket_id || t.id
            const checked = selectedIds.has(tid)
            const isRevealed = revealedIds.has(tid)
            return (
              <motion.tr
                key={tid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.015 }}
                className={cn(
                  'transition-all',
                  checked
                    ? isLight ? 'bg-blue-50/60' : 'bg-blue-500/5'
                    : isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/20',
                )}
              >
                {canBulkManage && (
                  <td className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSelect(tid)}
                      className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                    />
                  </td>
                )}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      isLight ? 'bg-amber-50' : 'bg-amber-500/10',
                    )}>
                      <User className={cn('w-3.5 h-3.5', isLight ? 'text-amber-600' : 'text-amber-400')} />
                    </div>
                    <span className={cn('font-semibold font-mono text-sm', textPrimary)}>
                      {t.username || '—'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('font-mono text-xs flex items-center gap-2', textSecondary)}>
                    {isRevealed ? (t.password || '—') : (t.password ? '•'.repeat(Math.min(t.password.length, 10)) : '—')}
                    {t.password && (
                      <button
                        onClick={() => onToggleReveal(tid)}
                        className={cn('hover:text-white transition-colors', textMuted)}
                      >
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('text-xs', textSecondary)}>{t.profile || 'default'}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold',
                    TICKET_STATUS_STYLE[t.status] || 'text-slate-400 bg-slate-500/10 border-slate-500/20',
                  )}>
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      t.status === 'AVAILABLE' && 'bg-emerald-400',
                      t.status === 'USED' && 'bg-blue-400',
                      t.status === 'EXPIRED' && 'bg-slate-500',
                      t.status === 'REVOKED' && 'bg-red-400',
                    )} />
                    {TICKET_STATUS_LABEL[t.status] || t.status || 'INCONNU'}
                  </span>
                </td>
                <td className={cn('px-4 py-3.5 hidden lg:table-cell text-xs', textSecondary)}>
                  {t.time_limit || 'Illimité'}
                </td>
                <td className={cn('px-4 py-3.5 hidden xl:table-cell text-xs', textSecondary)}>
                  {t.data_limit ? `${t.data_limit} MB` : '—'}
                </td>
                <td className={cn('px-4 py-3.5 hidden xl:table-cell text-[11px]', textSecondary)}>
                  {fmtDate(t.created_at)}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {t.status === 'AVAILABLE' && (
                      <button
                        onClick={() => onRevoke(tid)}
                        className={cn(
                          'h-8 px-2.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1',
                          isLight ? 'text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200' : 'text-amber-400 hover:bg-amber-500/10',
                        )}
                      >
                        <Ban className="w-3 h-3" />
                        <span className="hidden lg:inline">Révoquer</span>
                      </button>
                    )}
                    {t.status === 'REVOKED' && (
                      <button
                        onClick={() => onDelete(tid)}
                        className={cn(
                          'h-8 px-2.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1',
                          isLight ? 'text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200' : 'text-red-400 hover:bg-red-500/10',
                        )}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="hidden lg:inline">Supprimer</span>
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
