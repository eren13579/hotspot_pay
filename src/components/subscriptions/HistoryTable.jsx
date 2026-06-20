import { useState } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'
import { formatXAF, formatDateTime } from '../../utils/format'
import { getStatusInfo } from './constants'

export default function HistoryTable({ history, isLight, textPrimary, textSecondary, textMuted }) {
  const [open, setOpen] = useState(false)

  if (!history?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn('rounded-2xl border overflow-hidden', isLight ? 'bg-white border-slate-200' : 'bg-slate-900/20 border-slate-700/50')}
    >
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 transition-colors cursor-pointer',
          isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30',
        )}
        aria-expanded={open}
        aria-controls="history-table-panel"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className={cn('text-xs font-semibold', textPrimary)}>Historique</span>
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400')}>
            {history.length}
          </span>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform duration-200',
          open ? 'rotate-180' : '',
          textMuted,
        )} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="history-table-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={cn('border-t', isLight ? 'border-slate-200' : 'border-slate-700/50')}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <caption className="sr-only">Historique des abonnements</caption>
                  <thead>
                    <tr>
                      <th className={cn('text-left px-5 py-3 font-semibold', textMuted)}>Plan</th>
                      <th className={cn('text-right px-5 py-3 font-semibold', textMuted)}>Montant</th>
                      <th className={cn('text-center px-5 py-3 font-semibold', textMuted)}>Statut</th>
                      <th className={cn('text-right px-5 py-3 font-semibold hidden sm:table-cell', textMuted)}>Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map((h) => {
                      const info = getStatusInfo(h.status)
                      const Icon = info.icon
                      return (
                        <tr key={h.subscriptionId || h.id}>
                          <td className="px-5 py-3">
                            <span className={cn('font-semibold', textPrimary)}>{h.planName || '—'}</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={cn('font-mono font-bold', textPrimary)}>{formatXAF(h.amount || 0)}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border',
                              info.bg,
                            )}>
                              <Icon className="w-3 h-3" />
                              {info.label}
                            </span>
                          </td>
                          <td className={cn('px-5 py-3 text-right hidden sm:table-cell font-mono', textSecondary)}>
                            {h.createdAt || h.startsAt ? formatDateTime(h.createdAt || h.startsAt) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
