import { Check, User, MapPin, Server, Shield, CheckCircle } from 'lucide-react'
import { STEPS } from './constants'
import { cn } from '../../utils/cn'

/** Map step index → icon component */
const STEP_ICONS = [User, MapPin, Server, Shield, CheckCircle]

/**
 * StepIndicator — Stepper horizontal avec étapes visuelles
 * Props : step, isLight
 */
export default function StepIndicator({ step, isLight }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const Icon = i < step ? Check : STEP_ICONS[i]
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500',
              i === step
                ? 'bg-linear-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25 scale-110'
                : i < step
                  ? cn('text-emerald-400', isLight ? 'bg-emerald-500/15' : 'bg-emerald-500/20')
                  : isLight ? 'bg-slate-100 text-slate-300' : 'bg-slate-800 text-slate-600',
            )}>
              <Icon className="w-4 h-4" />
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'w-8 sm:w-12 h-0.5 rounded transition-all duration-500',
              i < step ? 'bg-emerald-500/50' : isLight ? 'bg-slate-100' : 'bg-slate-800',
            )} />
          )}
        </div>
      )
    })}
    </div>
  )
}
