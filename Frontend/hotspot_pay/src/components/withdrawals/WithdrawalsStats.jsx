import { Wallet, Clock, CheckCircle, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { formatXAF } from '../../utils/format'

/**
 * WithdrawalsStats — Cartes de résumé des retraits
 *
 * Props :
 *  - withdrawals : array
 *  - isLight     : boolean
 */
export default function WithdrawalsStats({ withdrawals, isLight }) {
  if (!withdrawals?.length) return null

  const totalPending = withdrawals
    .filter((w) => w.status === 'PENDING')
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0)
  const totalCompleted = withdrawals
    .filter((w) => w.status === 'COMPLETED')
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0)
  const pendingCount = withdrawals.filter((w) => w.status === 'PENDING').length
  const completedCount = withdrawals.filter((w) => w.status === 'COMPLETED').length
  const rejectedCount = withdrawals.filter((w) => w.status === 'REJECTED').length

  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  const cards = [
    {
      label: 'Total retiré',
      value: formatXAF(totalCompleted),
      icon: Wallet,
      color: isLight ? 'text-blue-600 bg-blue-50' : 'text-blue-400 bg-blue-500/10',
    },
    {
      label: 'En attente',
      value: `${formatXAF(totalPending)} · ${pendingCount}`,
      icon: Clock,
      color: isLight ? 'text-yellow-600 bg-yellow-50' : 'text-yellow-400 bg-yellow-500/10',
    },
    {
      label: 'Complétés',
      value: completedCount,
      icon: CheckCircle,
      color: isLight ? 'text-blue-600 bg-blue-50' : 'text-blue-400 bg-blue-500/10',
    },
    {
      label: 'Rejetés',
      value: rejectedCount,
      icon: XCircle,
      color: isLight ? 'text-red-600 bg-red-50' : 'text-red-400 bg-red-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.08 }}
          className={cn(
            'rounded-2xl p-4 border transition-all',
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-slate-900/50 border-slate-800',
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className={cn('text-[11px] font-semibold uppercase tracking-wider', textMuted)}>
              {card.label}
            </span>
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', card.color)}>
              <card.icon className="w-4 h-4" />
            </div>
          </div>
          <p className={cn(
            'text-xl font-black tracking-tight',
            isLight ? 'text-slate-900' : 'text-white',
          )}>
            {card.value}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
