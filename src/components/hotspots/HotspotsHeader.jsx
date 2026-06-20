import { Plus, Download, RefreshCw, LayoutList, LayoutGrid } from 'lucide-react'
import { cn } from '../../utils/cn'
import ScopeToggle from '../ui/ScopeToggle'
import HotspotStatusFilter from './HotspotStatusFilter'

/**
 * HotspotsHeader — En-tête de la page hotspots
 *
 * Props :
 *  - isLight          : boolean
 *  - title            : string
 *  - filteredCount    : number
 *  - totalElements    : number
 *  - isAdmin          : boolean
 *  - scope            : 'global' | 'self'
 *  - onScopeChange    : fn(scope)
 *  - statusFilter     : string
 *  - onStatusFilterChange : fn(key)
 *  - viewMode         : 'list' | 'card'
 *  - onViewModeChange : fn(mode)
 *  - planLevel        : number
 *  - onExport         : fn()
 *  - refreshing       : boolean
 *  - onRefresh        : fn()
 *  - onAdd            : fn()
 */
export default function HotspotsHeader({
  isLight, title, filteredCount, totalElements,
  isAdmin, scope, onScopeChange,
  statusFilter, onStatusFilterChange,
  viewMode, onViewModeChange,
  planLevel, onExport, refreshing, onRefresh, onAdd,
}) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div>
          <h1 className={cn('text-xl font-bold tracking-tight', textPrimary)}>{title}</h1>
          <p className={cn('text-xs mt-0.5', textSecondary)}>
            {filteredCount} / {totalElements} hotspot{totalElements !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && <ScopeToggle scope={scope} onChange={onScopeChange} isLight={isLight} size="sm" />}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onRefresh}
          aria-label="Rafraîchir"
          className={cn(
            'flex items-center justify-center h-9 w-9 rounded-xl transition-all',
            isLight
              ? 'text-slate-400 hover:bg-slate-100 border border-slate-200 bg-white'
              : 'text-slate-500 hover:bg-slate-800 border border-slate-700/50 bg-slate-900',
          )}
          title="Rafraîchir"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
        </button>

        <HotspotStatusFilter value={statusFilter} onChange={onStatusFilterChange} isLight={isLight} />

        {/* View toggle */}
        <div className={cn(
          'flex items-center p-0.5 rounded-xl border',
          isLight ? 'border-slate-200 bg-white' : 'border-slate-700/50 bg-slate-900',
        )}>
          <button
            onClick={() => onViewModeChange('list')}
            aria-label="Vue liste"
            className={cn(
              'flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-all',
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white',
            )}
            title="Vue liste"
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewModeChange('card')}
            aria-label="Vue cartes"
            className={cn(
              'flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-all',
              viewMode === 'card'
                ? 'bg-blue-600 text-white shadow-sm'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white',
            )}
            title="Vue cartes"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Export CSV (PRO+) */}
        {planLevel >= 1 && (
          <button
            onClick={onExport}
            className={cn(
              'flex items-center gap-1.5 h-9 px-3 rounded-xl text-[11px] font-semibold transition-all',
              isLight
                ? 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200 bg-white'
                : 'text-emerald-400 hover:bg-emerald-500/10 border border-emerald-700/50 bg-slate-900',
            )}
            title="Exporter CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        )}

        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ajouter</span>
          <span className="sm:hidden">Nouveau</span>
        </button>
      </div>
    </div>
  )
}
