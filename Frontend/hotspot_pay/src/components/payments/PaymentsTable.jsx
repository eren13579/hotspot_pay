import { CreditCard, Smartphone, Building, Wallet, RotateCw, Undo2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { getStatusInfo, formatDateTime } from '../../utils/format'

/**
 * PaymentsTable — Tableau desktop des paiements
 *
 * Props :
 *  - payments       : array
 *  - isLight        : boolean
 *  - textMuted      : string
 *  - onDetails      : fn(payment)
 *  - isPro          : boolean
 *  - isPremium      : boolean
 *  - isAdmin        : boolean
 *  - onRefreshStatus: fn(payment)
 *  - onRefund       : fn(id)
 *  - refundingId    : string | null
 */
const OPERATOR_ICONS = {
  MTN: Smartphone,
  ORANGE: Smartphone,
  MONEROO: Building,
  CAMPAY: Wallet,
}

export default function PaymentsTable({
  payments, isLight, textMuted, onDetails,
  isPro, isPremium, isAdmin, onRefreshStatus, onRefund, refundingId,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <caption className="sr-only">Liste des paiements</caption>
        <thead>
          <tr className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
            <th className={cn('text-left px-5 py-3.5 font-semibold', textMuted)}>Référence</th>
            <th className={cn('text-left px-5 py-3.5 font-semibold hidden md:table-cell', textMuted)}>Client</th>
            <th className={cn('text-left px-5 py-3.5 font-semibold', textMuted)}>Opérateur</th>
            <th className={cn('text-right px-5 py-3.5 font-semibold', textMuted)}>Montant</th>
            <th className={cn('text-center px-5 py-3.5 font-semibold', textMuted)}>Statut</th>
            <th className={cn('text-right px-5 py-3.5 font-semibold hidden sm:table-cell', textMuted)}>Date</th>
            <th className={cn('text-right px-5 py-3.5 font-semibold', textMuted)}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {payments.map((p) => {
            const statusInfo = getStatusInfo(p.status)
            const OperatorIcon = OPERATOR_ICONS[p.operator] || CreditCard
            const isPending = p.status === 'PENDING'

            return (
              <tr key={p.payment_id || p.id} className={cn('transition-colors', isLight ? 'hover:bg-slate-50 divide-slate-100' : 'hover:bg-slate-800/20 divide-slate-800/50')}>
                <td className="px-5 py-3">
                  <span className={cn('font-mono font-semibold text-[11px]', isLight ? 'text-slate-900' : 'text-white')}>
                    {p.reference || '—'}
                  </span>
                </td>

                <td className="px-5 py-3 hidden md:table-cell">
                  <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                    {p.client_phone || '—'}
                  </span>
                </td>

                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isLight ? 'bg-slate-100' : 'bg-slate-800')}>
                      {OperatorIcon && <OperatorIcon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={cn('font-medium', isLight ? 'text-slate-700' : 'text-slate-300')}>
                      {p.operator || '—'}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-3 text-right">
                  <span className={cn('font-bold', isLight ? 'text-slate-900' : 'text-white')}>
                    {Number(p.amount || 0).toLocaleString('fr-FR')} <span className="text-[10px] font-medium">XAF</span>
                  </span>
                </td>

                <td className="px-5 py-3 text-center">
                  <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border', statusInfo.color)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', p.status === 'SUCCESS' && 'bg-emerald-400', p.status === 'PENDING' && 'bg-yellow-400', p.status === 'FAILED' && 'bg-red-400', !['SUCCESS', 'PENDING', 'FAILED'].includes(p.status) && 'bg-slate-400')} />
                    {statusInfo.label}
                  </span>
                </td>

                <td className={cn('px-5 py-3 text-right hidden sm:table-cell', isLight ? 'text-slate-500' : 'text-slate-400')}>
                  {p.created_at ? formatDateTime(p.created_at) : '—'}
                </td>

                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Refresh PENDING status */}
                    {isPending && isPro && (
                      <button onClick={() => onRefreshStatus(p)} aria-label="Vérifier le statut"
                        className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer', isLight ? 'text-amber-500 hover:bg-amber-50' : 'text-amber-400 hover:bg-amber-500/10')}
                        title="Vérifier le statut">
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {/* Refund (admin + PREMIUM) */}
                    {p.status === 'SUCCESS' && isPremium && isAdmin && (
                      <button onClick={() => onRefund(p.payment_id || p.id)} disabled={refundingId === (p.payment_id || p.id)} aria-label="Rembourser"
                        className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-40', isLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10')}
                        title="Rembourser">
                        <Undo2 className={cn('w-3.5 h-3.5', refundingId === (p.payment_id || p.id) && 'animate-pulse')} />
                      </button>
                    )}
                    <button onClick={() => onDetails(p)}
                      className={cn('px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer', isLight ? 'text-blue-600 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-500/10')}>
                      Détails
                    </button>
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
