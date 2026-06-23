import { CreditCard, Smartphone, Building, Wallet, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { getStatusInfo, formatDateTime } from '../../utils/format'

/**
 * PaymentsMobileCards — Vue mobile en cartes des paiements
 *
 * Props :
 *  - payments   : array
 *  - isLight    : boolean
 *  - textMuted  : string
 *  - onDetails  : fn(payment)
 */
const OPERATOR_ICONS = {
  MTN: Smartphone,
  ORANGE: Smartphone,
  MONEROO: Building,
  CAMPAY: Wallet,
}

export default function PaymentsMobileCards({ payments, isLight, textMuted, onDetails }) {
  return (
    <div className="space-y-2">
      {payments.map((p) => {
        const statusInfo = getStatusInfo(p.status)
        const OperatorIcon = OPERATOR_ICONS[p.operator] || CreditCard
        const cardCls = isLight
          ? 'bg-white border border-slate-200 shadow-sm'
          : 'bg-slate-800/40 border border-slate-700/50'

        return (
          <div key={p.payment_id || p.id} className={cn('rounded-xl p-3.5', cardCls)}>
            {/* Row 1 : Référence + Statut */}
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                'font-mono font-semibold text-[11px]',
                isLight ? 'text-slate-900' : 'text-white',
              )}>
                {p.reference || '—'}
              </span>
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                statusInfo.color,
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  p.status === 'SUCCESS' && 'bg-emerald-400',
                  p.status === 'PENDING' && 'bg-yellow-400',
                  p.status === 'FAILED' && 'bg-red-400',
                  !['SUCCESS', 'PENDING', 'FAILED'].includes(p.status) && 'bg-slate-400',
                )} />
                {statusInfo.label}
              </span>
            </div>

            {/* Row 2 : Opérateur + Montant */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  'w-6 h-6 rounded-lg flex items-center justify-center',
                  isLight ? 'bg-slate-100' : 'bg-slate-800',
                )}>
                  {OperatorIcon && <OperatorIcon className="w-3 h-3" />}
                </div>
                <span className={cn('text-xs font-medium', isLight ? 'text-slate-700' : 'text-slate-300')}>
                  {p.operator || '—'}
                </span>
              </div>
              <span className={cn('font-bold text-sm', isLight ? 'text-slate-900' : 'text-white')}>
                {Number(p.amount || 0).toLocaleString('fr-FR')} <span className="text-[10px] font-medium">XAF</span>
              </span>
            </div>

            {/* Row 3 : Client + Date + Action */}
            <div className="flex items-center justify-between mt-2">
              <div className="min-w-0 flex-1">
                {p.client_phone && (
                  <p className={cn('text-[11px] truncate flex items-center gap-1', textMuted)}>
                    <Smartphone className="w-3 h-3 shrink-0" />
                    {p.client_phone}
                  </p>
                )}
                <p className={cn('text-[10px]', textMuted)}>
                  {p.created_at ? formatDateTime(p.created_at) : '—'}
                </p>
              </div>
              <button
                onClick={() => onDetails(p)}
                aria-label="Voir les détails du paiement"
                className={cn(
                  'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                  isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-700',
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
