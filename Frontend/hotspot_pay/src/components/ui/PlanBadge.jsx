import { Wifi } from 'lucide-react'
import { cn } from '../../utils/cn'

const plans = {
  PREMIUM: {
    label: 'Premium',
    dark: 'text-amber-300 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-500/30 shadow-sm shadow-amber-500/10',
    light: 'text-amber-700 bg-gradient-to-r from-amber-500/15 to-orange-500/10 border-amber-500/30 shadow-sm shadow-amber-500/5',
  },
  PRO: {
    label: 'Pro',
    dark: 'text-blue-300 bg-gradient-to-r from-blue-500/20 to-cyan-500/10 border-blue-500/30 shadow-sm shadow-blue-500/10',
    light: 'text-blue-700 bg-gradient-to-r from-blue-500/15 to-cyan-500/10 border-blue-500/30 shadow-sm shadow-blue-500/5',
  },
  STANDARD: {
    label: 'Standard',
    dark: 'text-slate-300 bg-slate-800/80 border-slate-700/50',
    light: 'text-slate-600 bg-slate-100 border-slate-200',
  },
  BASIC: {
    label: 'Standard',
    dark: 'text-slate-300 bg-slate-800/80 border-slate-700/50',
    light: 'text-slate-600 bg-slate-100 border-slate-200',
  },
}

export default function PlanBadge({ planType, className, theme = 'dark' }) {
  const plan = plans[planType] || plans.STANDARD
  const isLight = theme === 'light'

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-colors duration-200',
      isLight ? plan.light : plan.dark,
      className,
    )}>
      <Wifi className={cn('w-3 h-3', planType === 'PREMIUM' && 'text-amber-400', planType === 'PRO' && 'text-blue-400')} />
      {plan.label}
    </span>
  )
}
