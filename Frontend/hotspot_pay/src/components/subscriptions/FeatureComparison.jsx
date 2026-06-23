import { useState } from 'react'
import { BarChart3, Check, X, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'

export default function FeatureComparison({ plans, currentPlanName, isLight, textPrimary, textMuted }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={cn('rounded-2xl border overflow-hidden', isLight ? 'bg-white border-slate-200' : 'bg-slate-900/20 border-slate-700/50')}
    >
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 transition-colors cursor-pointer',
          isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30',
        )}
        aria-expanded={open}
        aria-controls="feature-comparison-panel"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          <span className={cn('text-xs font-semibold', textPrimary)}>Comparaison détaillée</span>
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
            id="feature-comparison-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={cn('border-t px-5 py-4', isLight ? 'border-slate-200' : 'border-slate-700/50')}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <caption className="sr-only">Comparaison des fonctionnalités par plan</caption>
                  <thead>
                    <tr>
                      <th className={cn('text-left pb-3 font-semibold', textMuted)}>Fonctionnalité</th>
                      {plans.map(t => (
                        <th key={t.key} className={cn('text-center pb-3 font-semibold', currentPlanName === t.key ? textPrimary : textMuted)}>
                          <div className="flex items-center justify-center gap-1">
                            <t.icon className="w-3 h-3" />
                            {t.label}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {plans[0]?.features.map((feat, i) => (
                      <tr key={i} className={cn(isLight ? 'divide-slate-100' : 'divide-slate-700/20')}>
                        <td className={cn('py-2.5 pr-4 font-medium', textPrimary)}>{feat.label}</td>
                        {plans.map(t => {
                          const f = t.features[i]
                          return (
                            <td key={t.key} className="py-2.5 text-center">
                              {f?.ok ? (
                                <Check className={cn(
                                  'w-3.5 h-3.5 mx-auto',
                                  f.highlight ? 'text-emerald-400' : textMuted,
                                )} />
                              ) : (
                                <X className={cn('w-3.5 h-3.5 mx-auto', textMuted)} />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
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
