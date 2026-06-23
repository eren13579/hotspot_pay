import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Smartphone, Building, Wallet, RotateCw, Undo2, Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../utils/cn'
import { getStatusInfo, formatDateTime, formatDate } from '../../utils/format'

/**
 * PaymentDetailModal — Modal affichant les détails complets d'un paiement
 *
 * Props :
 *  - payment         : object | null
 *  - onClose         : fn()
 *  - isLight         : boolean
 *  - isPremium       : boolean
 *  - isAdmin         : boolean
 *  - onRefreshStatus : fn(payment)
 *  - onRefund        : fn(id)
 *  - refundingId     : string | null
 */
const OPERATOR_ICONS = {
  MTN: Smartphone,
  ORANGE: Smartphone,
  MONEROO: Building,
  CAMPAY: Wallet,
}

export default function PaymentDetailModal({ payment, onClose, isLight, isPremium, isAdmin, onRefreshStatus, onRefund, refundingId }) {
  if (!payment) return null

  const statusInfo = getStatusInfo(payment.status)
  const OperatorIcon = OPERATOR_ICONS[payment.operator] || CreditCard
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const bgCls = isLight ? 'bg-white' : 'bg-slate-900'
  const borderCls = isLight ? 'border-slate-200' : 'border-slate-800'
  const rowCls = isLight ? 'border-slate-100' : 'border-slate-800/50'
  const isPending = payment.status === 'PENDING'
  const isSuccess = payment.status === 'SUCCESS'
  const paymentId = payment.payment_id || payment.id

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className={cn('w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden', bgCls, borderCls)}
        >
          {/* Header */}
          <div className={cn('flex items-center justify-between px-6 py-4 border-b', rowCls)}>
            <div>
              <h2 className={cn('text-base font-bold', textPrimary)}>Détails du paiement</h2>
              <p className={cn('text-[11px] font-mono', textSecondary)}>{payment.reference || '—'}</p>
            </div>
            <button onClick={onClose}
              className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer', isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800')}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Status badge + montant + actions rapides */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border', statusInfo.color)}>
                  <span className={cn('w-2 h-2 rounded-full', isSuccess && 'bg-emerald-400', isPending && 'bg-yellow-400', payment.status === 'FAILED' && 'bg-red-400', !['SUCCESS', 'PENDING', 'FAILED'].includes(payment.status) && 'bg-slate-400')} />
                  {statusInfo.label}
                </span>
                {/* Actions inline */}
                <div className="flex gap-1.5">
                  {isPending && (
                    <button onClick={() => onRefreshStatus(payment)}
                      className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer', isLight ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20')}>
                      <RotateCw className="w-3 h-3" /> Vérifier
                    </button>
                  )}
                  {isSuccess && isPremium && isAdmin && (
                    <button onClick={() => onRefund(paymentId)} disabled={refundingId === paymentId}
                      className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-40', isLight ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-red-500/10 text-red-300 hover:bg-red-500/20')}>
                      <Undo2 className={cn('w-3 h-3', refundingId === paymentId && 'animate-pulse')} /> Rembourser
                    </button>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={cn('text-2xl font-black tracking-tight', textPrimary)}>
                  {Number(payment.amount || 0).toLocaleString('fr-FR')} <span className="text-sm font-medium">{payment.currency || 'XAF'}</span>
                </span>
                {isSuccess && (
                  <p className={cn('text-[10px] mt-1', textMuted)}>
                    <Download className="inline w-3 h-3 mr-0.5" />
                    <button className="underline cursor-pointer hover:text-blue-400" onClick={() => toast?.info('Fonctionnalité à venir')}>
                      Télécharger reçu
                    </button>
                  </p>
                )}
              </div>
            </div>

            {/* Détails */}
            <div className={cn('rounded-xl border divide-y', bgCls, borderCls, rowCls)}>
              <DetailRow label="Opérateur" isLight={isLight}>
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isLight ? 'bg-slate-100' : 'bg-slate-800')}>
                    {OperatorIcon && <OperatorIcon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={cn('font-medium', textPrimary)}>{payment.operator || '—'}</span>
                </div>
              </DetailRow>

              <DetailRow label="Client" isLight={isLight}>
                <span className={cn('font-medium', textPrimary)}>{payment.client_phone || '—'}</span>
              </DetailRow>

              <DetailRow label="Montant" isLight={isLight}>
                <span className={cn('font-bold', textPrimary)}>{Number(payment.amount || 0).toLocaleString('fr-FR')} {payment.currency || 'XAF'}</span>
              </DetailRow>

              <DetailRow label="Transaction ID" isLight={isLight}>
                <span className={cn('font-mono text-[11px]', textPrimary)}>{payment.gateway_tx_id || '—'}</span>
              </DetailRow>

              <DetailRow label="Date création" isLight={isLight}>
                <span className={textPrimary}>{payment.created_at ? formatDateTime(payment.created_at) : '—'}</span>
              </DetailRow>

              {payment.paid_at && (
                <DetailRow label="Date paiement" isLight={isLight}>
                  <span className={textPrimary}>{formatDateTime(payment.paid_at)}</span>
                </DetailRow>
              )}

              {payment.failure_reason && (
                <DetailRow label="Raison échec" isLight={isLight}>
                  <span className="text-red-400">{payment.failure_reason}</span>
                </DetailRow>
              )}

              {payment.hotspot_name && (
                <DetailRow label="Hotspot" isLight={isLight}>
                  <span className={textPrimary}>{payment.hotspot_name}</span>
                </DetailRow>
              )}

              {payment.plan_name && (
                <DetailRow label="Forfait" isLight={isLight}>
                  <span className={textPrimary}>{payment.plan_name}</span>
                </DetailRow>
              )}

              {payment.checkout_url && (
                <DetailRow label="URL de paiement" isLight={isLight}>
                  <a href={payment.checkout_url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline text-[11px] truncate block max-w-60">
                    {payment.checkout_url}
                  </a>
                </DetailRow>
              )}
            </div>

            {/* Receipt download */}
            {isSuccess && (
              <div className={cn('rounded-xl border p-3 flex items-center justify-between', isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-500/5 border-emerald-800/50')}>
                <div className="flex items-center gap-2">
                  <FileText className={cn('w-4 h-4', isLight ? 'text-emerald-600' : 'text-emerald-400')} />
                  <span className={cn('text-xs font-medium', isLight ? 'text-emerald-800' : 'text-emerald-300')}>Reçu de paiement</span>
                </div>
                <button onClick={() => toast?.info('Fonctionnalité à venir')}
                  className={cn('flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer', isLight ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-500 text-white hover:bg-emerald-600')}>
                  <Download className="w-3 h-3" /> PDF
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={cn('px-6 py-3 border-t flex justify-between items-center', rowCls)}>
            {isPremium && isAdmin && isSuccess && (
              <button onClick={() => onRefund(paymentId)} disabled={refundingId === paymentId}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-40', isLight ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10')}>
                <Undo2 className={cn('w-3.5 h-3.5', refundingId === paymentId && 'animate-pulse')} />
                {refundingId === paymentId ? 'Remboursement...' : 'Rembourser'}
              </button>
            )}
            <div className={isPremium && isAdmin && isSuccess ? '' : 'ml-auto'}>
              <button onClick={onClose}
                className={cn('px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer', isLight ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')}>
                Fermer
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * DetailRow — Ligne clé/valeur dans le détail
 */
function DetailRow({ label, children, isLight }) {
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  return (
    <div className={cn('flex items-center justify-between px-4 py-3', isLight ? 'border-slate-100' : 'border-slate-800/50')}>
      <span className={cn('text-xs font-medium', textMuted)}>{label}</span>
      <div className="text-xs text-right">{children}</div>
    </div>
  )
}
