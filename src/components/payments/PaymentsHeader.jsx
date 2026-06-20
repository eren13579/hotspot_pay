import { Activity, RefreshCw } from 'lucide-react'
import { cn } from '../../utils/cn'
import HotspotSelector from '../ui/HotspotSelector'
import ScopeToggle from '../ui/ScopeToggle'

/**
 * PaymentsHeader — En-tête de la page paiements
 *
 * Props :
 *  - isLight           : boolean
 *  - textPrimary       : string
 *  - textSecondary     : string
 *  - refreshing        : boolean
 *  - onRefresh         : fn()
 *  - hotspots          : array
 *  - selectedHotspotId : string
 *  - onHotspotSelect   : fn(id)
 *  - totalCount        : number
 *  - scope             : 'global' | 'self'
 *  - isAdmin           : boolean
 *  - onScopeChange     : fn(scope)
 */
export default function PaymentsHeader({
  isLight, textPrimary, textSecondary, refreshing, onRefresh,
  hotspots, selectedHotspotId, onHotspotSelect, totalCount,
  scope, isAdmin, onScopeChange,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0',
          isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400',
        )}>
          <Activity className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className={cn('text-xl font-black tracking-tight', textPrimary)}>Paiements</h1>
          <p className={cn('text-xs', textSecondary)}>
            {totalCount ?? '—'} transaction{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {isAdmin && hotspots?.length > 0 && (
          <div className="w-full sm:w-56">
            <HotspotSelector
              hotspots={hotspots}
              selectedId={selectedHotspotId}
              onSelect={onHotspotSelect}
              isLight={isLight}
              placeholder="Tous les hotspots"
            />
          </div>
        )}
        {isAdmin && (
          <ScopeToggle scope={scope} onChange={onScopeChange} isLight={isLight} size="sm" />
        )}
      </div>

      <button onClick={onRefresh} disabled={refreshing} aria-label="Rafraîchir les paiements"
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all self-start sm:self-auto',
          refreshing ? 'cursor-not-allowed' : '',
          isLight
            ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            : 'text-slate-400 hover:text-white hover:bg-slate-800',
        )}>
        <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
      </button>
    </div>
  )
}
