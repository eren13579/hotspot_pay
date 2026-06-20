import { cn } from '../../utils/cn'

/**
 * ConnectivityPulse — Le voyant lumineux "routeur WiFi"
 *
 * Métaphore visuelle de la connectivité : un point central ambre
 * avec 2 anneaux concentriques qui s'expandent, exactement comme
 * le voyant lumineux d'un routeur WiFi.
 *
 * Props :
 *  - active  : boolean (true = allumé, false = éteint)
 *  - size    : 'sm' | 'md' | 'lg'
 *  - className : classes supplémentaires
 */
const sizes = {
  sm: { dot: 'w-3 h-3', ring: 'w-3 h-3', count: 'w-5 h-5' },
  md: { dot: 'w-4 h-4', ring: 'w-4 h-4', count: 'w-6 h-6' },
  lg: { dot: 'w-5 h-5', ring: 'w-5 h-5', count: 'w-8 h-8' },
}

export default function ConnectivityPulse({ active = true, size = 'md', className }) {
  const s = sizes[size] || sizes.md

  if (!active) {
    return (
      <div className={cn('relative flex items-center justify-center', className)}>
        <div className={cn('rounded-full bg-slate-700 border-2 border-slate-600', s.dot)} />
      </div>
    )
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Anneau 2 (le plus grand) */}
      <div className={cn(
        'absolute rounded-full border-2 border-amber-400/30',
        'animate-pulse-ring-2 pointer-events-none',
        s.ring,
      )} />
      {/* Anneau 1 */}
      <div className={cn(
        'absolute rounded-full border-2 border-amber-500/40',
        'animate-pulse-ring-1 pointer-events-none',
        s.ring,
      )} />
      {/* Point central */}
      <div className={cn(
        'rounded-full bg-amber-400 shadow-lg shadow-amber-500/30',
        'animate-pulse-connect',
        s.dot,
      )} />
    </div>
  )
}
