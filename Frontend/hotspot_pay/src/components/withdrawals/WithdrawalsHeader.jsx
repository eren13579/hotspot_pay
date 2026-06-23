import { Wallet, RefreshCw } from 'lucide-react'
import { cn } from '../../utils/cn'
import ScopeToggle from '../ui/ScopeToggle'

/**
 * WithdrawalsHeader — En-tête de la page retraits
 *
 * Props :
 *  - isLight        : boolean
 *  - textPrimary    : string
 *  - textSecondary  : string
 *  - refreshing     : boolean
 *  - onRefresh      : fn()
 *  - totalCount     : number
 *  - scope          : 'global' | 'self'
 *  - isAdmin        : boolean
 *  - onScopeChange  : fn(scope)
 *  - onNew          : fn()
 */
export default function WithdrawalsHeader({
  isLight, textPrimary, textSecondary, refreshing, onRefresh,
  totalCount, scope, isAdmin, onScopeChange, onNew,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn(
          'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0',
          isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400',
        )}>
          <Wallet className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className={cn('text-xl font-black tracking-tight', textPrimary)}>Retraits</h1>
          <p className={cn('text-xs', textSecondary)}>
            {totalCount ?? '—'} retrait{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {isAdmin && (
          <ScopeToggle scope={scope} onChange={onScopeChange} isLight={isLight} size="sm" />
        )}

        <button onClick={onNew}
            className={cn('flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0',
              isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')}>
            <Wallet className="w-3.5 h-3.5" />
            Nouveau retrait
          </button>

        <button onClick={onRefresh} disabled={refreshing} aria-label="Rafraîchir les retraits"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all',
            refreshing ? 'cursor-not-allowed' : '',
            isLight
              ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              : 'text-slate-400 hover:text-white hover:bg-slate-800',
          )}>
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
        </button>
      </div>
    </div>
  )
}
