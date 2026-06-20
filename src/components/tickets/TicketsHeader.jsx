import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * TicketsHeader — En-tête de la vue hotspot sélectionné
 *
 * Props :
 *  - isLight          : boolean (requis)
 *  - selectedHotspot  : object | null (requis)
 *  - needsUpgrade     : boolean (requis)
 *  - hsLocation       : string (requis)
 *  - totalElements    : number (requis)
 *  - filteredCount    : number (requis)
 *  - onBack           : fn() (requis)
 */
export default function TicketsHeader({ isLight, selectedHotspot, needsUpgrade, hsLocation, totalElements, filteredCount, onBack }) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 relative">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className={cn(
            'p-2.5 rounded-xl transition-all shrink-0 hover:scale-105 active:scale-95',
            isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400',
          )}
          title="Changer de hotspot"
        >
          <ChevronDown className="w-4 h-4 rotate-90" />
        </button>
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center',
          isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400',
        )}>
          <TicketIcon />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className={cn('text-2xl font-black tracking-tight', textPrimary)}>
              {selectedHotspot?.name || 'Tickets'}
            </h1>
            {needsUpgrade && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-400 border border-slate-600/50">
                Standard
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm mt-0.5">
            <span className={textSecondary}>
              {filteredCount} / {totalElements} ticket{totalElements !== 1 ? 's' : ''}
            </span>
            {hsLocation && (
              <>
                <span className={textMuted}>·</span>
                <span className={textMuted}>{hsLocation}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TicketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M9 9h.01" /><path d="M15 9h.01" /><path d="M9 13a3 3 0 0 0 6 0" />
    </svg>
  )
}
