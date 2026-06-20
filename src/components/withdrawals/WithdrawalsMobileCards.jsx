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
 * WithdrawalsMobileCards — Vue mobile en cartes des retraits
 *
 * Props :
 *  - withdrawals : array
 *  - isLight     : boolean
 *  - textMuted   : string
 *  - onCancel    : fn(id)
 */
export default function WithdrawalsMobileCards({ withdrawals, isLight, textMuted, onCancel }) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'

  return (
    <div className="space-y-2">
      {withdrawals.map((w) => {
        const info = getInfo(w.status)
        const wid = w.withdrawalId || w.id
        const cardCls = isLight
          ? 'bg-white border border-slate-200 shadow-sm'
          : 'bg-slate-800/40 border border-slate-700/50'

        return (
          <div key={wid} className={cn('rounded-xl p-3.5', cardCls)}>
            <div className="flex items-center justify-between mb-2">
              <span className={cn('font-mono font-semibold text-[11px]', textPrimary)}>
                {wid?.slice(0, 8) || '—'}
              </span>
              <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', info.color)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', info.dot)} />{info.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn('font-bold text-sm', textPrimary)}>{formatXAF(w.amount || 0)}</span>
              {w.status === 'PENDING' && (
                <button onClick={() => onCancel(wid)}
                  className={cn('px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer',
                    isLight ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10')}>
                  Annuler
                </button>
              )}
            </div>
            <p className={cn('text-[10px] mt-1', textSecondary)}>
              {w.createdAt ? formatDateTime(w.createdAt) : '—'}
            </p>
          </div>
        )
      })}
    </div>
  )
}
