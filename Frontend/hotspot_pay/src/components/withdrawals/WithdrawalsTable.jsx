import { X, ArrowUpRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatXAF, formatDateTime } from '../../utils/format'

const STATUS_STYLES = {
  PENDING: { bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-400' },
  APPROVED: { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
  COMPLETED: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  REJECTED: { bg: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
  CANCELLED: { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400' },
}

const STATUS_LABEL = {
  PENDING: 'En attente', APPROVED: 'Approuvé', COMPLETED: 'Complété',
  REJECTED: 'Rejeté', CANCELLED: 'Annulé',
}

function getInfo(status) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.CANCELLED
  return { color: s.bg, dot: s.dot, label: STATUS_LABEL[status] || status }
}

/**
 * WithdrawalsTable — Tableau desktop des retraits
 *
 * Props :
 *  - withdrawals : array
 *  - isLight     : boolean
 *  - textMuted   : string
 *  - onCancel    : fn(id)
 *  - isPremium   : boolean
 *  - isAdmin     : boolean
 *  - onApprove   : fn(id)
 *  - onReject    : fn(id)
 */
export default function WithdrawalsTable({
  withdrawals, isLight, textMuted, onCancel,
  isPremium, isAdmin, onApprove, onReject,
}) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <caption className="sr-only">Liste des retraits</caption>
        <thead>
          <tr className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
            <th className={cn('text-left px-5 py-3.5 font-semibold', textMuted)}>Référence</th>
            {isAdmin && <th className={cn('text-left px-5 py-3.5 font-semibold', textMuted)}>Utilisateur</th>}
            <th className={cn('text-right px-5 py-3.5 font-semibold', textMuted)}>Montant</th>
            <th className={cn('text-center px-5 py-3.5 font-semibold', textMuted)}>Statut</th>
            <th className={cn('text-right px-5 py-3.5 font-semibold hidden sm:table-cell', textMuted)}>Date</th>
            <th className={cn('text-right px-5 py-3.5 font-semibold', textMuted)}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {withdrawals.map((w) => {
            const info = getInfo(w.status)
            const wid = w.withdrawalId || w.id
            return (
              <tr key={wid} className={cn('transition-colors', isLight ? 'hover:bg-slate-50 divide-slate-100' : 'hover:bg-slate-800/20 divide-slate-800/50')}>
                <td className="px-5 py-3">
                  <span className={cn('font-mono font-semibold text-[11px]', textPrimary)}>
                    {wid?.slice(0, 8) || '—'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-5 py-3">
                    <span className={cn('font-mono text-[10px]', textSecondary)}>
                      {w.userId ? w.userId.slice(0, 8) + '…' : '—'}
                    </span>
                  </td>
                )}
                <td className="px-5 py-3 text-right">
                  <span className={cn('font-bold', textPrimary)}>{formatXAF(w.amount || 0)}</span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border', info.color)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', info.dot)} />{info.label}
                  </span>
                </td>
                <td className={cn('px-5 py-3 text-right hidden sm:table-cell', textSecondary)}>
                  {w.createdAt ? formatDateTime(w.createdAt) : '—'}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {w.status === 'PENDING' && (
                      <>
                        <button onClick={() => onCancel(wid)}
                          className={cn('px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer',
                            isLight ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10')}>
                          Annuler
                        </button>
                        {isPremium && isAdmin && (
                          <>
                            <button onClick={() => onApprove?.(wid)}
                              className={cn('px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer',
                                isLight ? 'text-blue-600 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-500/10')}>
                              Approuver
                            </button>
                            <button onClick={() => onReject?.(wid)}
                              className={cn('px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer',
                                isLight ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10')}>
                              Rejeter
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {w.status === 'COMPLETED' && (
                      <span className={cn('text-[10px] flex items-center gap-1', textSecondary)}>
                        <ArrowUpRight className="w-3 h-3" /> Versé
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
