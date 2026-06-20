import { Lock } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * UpgradeBanner — Bannière "Passez à Pro/Premium"
 *
 * Props :
 *  - needsUpgrade : boolean (requis)
 *  - isLight      : boolean (requis)
 *  - onNavigate   : fn() (requis)
 */
export default function UpgradeBanner({ needsUpgrade, isLight, onNavigate }) {
  if (!needsUpgrade) return null

  return (
    <div className={cn(
      'flex items-center gap-3 px-5 py-3 rounded-xl border text-xs',
      isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/5 border-amber-500/20',
    )}>
      <Lock className={cn('w-4 h-4 shrink-0', isLight ? 'text-amber-500' : 'text-amber-400')} />
      <p className={cn('flex-1', isLight ? 'text-amber-800' : 'text-amber-300')}>
        Passez à <strong className="text-amber-400">Pro</strong> ou <strong className="text-amber-400">Premium</strong> pour exporter en CSV et gérer les tickets en masse.
      </p>
      <button
        onClick={onNavigate}
        className="shrink-0 h-8 px-4 rounded-lg bg-amber-600 text-white text-[11px] font-semibold hover:bg-amber-500 transition-all"
      >
        Voir les offres
      </button>
    </div>
  )
}
