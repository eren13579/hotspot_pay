import { motion } from 'framer-motion'
import { CreditCard } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatXAF } from '../../utils/format'

/**
 * RecentPayments — Tableau des dernières transactions
 */
export default function RecentPayments({ payments, isLight, containerCls }) {
  if (!payments?.length) return null

  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className={cn('rounded-2xl overflow-hidden', containerCls)}>
      <div className={cn('flex items-center justify-between px-6 py-4 border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
        <h3 className={cn('text-sm font-bold', textPrimary)}>Dernières transactions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={cn('border-b', isLight ? 'border-slate-100' : 'border-slate-800')}>
              <th className={cn('text-left px-6 py-3 font-semibold', textMuted)}>Hotspot</th>
              <th className={cn('text-right px-6 py-3 font-semibold', textMuted)}>Montant</th>
              <th className={cn('text-right px-6 py-3 font-semibold hidden sm:table-cell', textMuted)}>Date</th>
              <th className={cn('text-right px-6 py-3 font-semibold hidden md:table-cell', textMuted)}>Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((p, i) => (
              <tr key={i} className={cn('transition-colors', isLight ? 'hover:bg-slate-50 divide-slate-100' : 'hover:bg-slate-800/20 divide-slate-800/50')}>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center', isLight ? 'bg-emerald-50' : 'bg-emerald-500/10')}>
                      <CreditCard className={cn('w-3 h-3', isLight ? 'text-emerald-600' : 'text-emerald-400')} />
                    </div>
                    <span className={cn('font-medium', textPrimary)}>{p.hotspotName}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-right font-semibold">{formatXAF(p.amount)}</td>
                <td className={cn('px-6 py-3 text-right hidden sm:table-cell', textSecondary)}>{p.paidAt?.slice(0, 10) || '—'}</td>
                <td className="px-6 py-3 text-right hidden md:table-cell">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
