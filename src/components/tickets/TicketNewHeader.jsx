import { ArrowLeft } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * TicketNewHeader — En-tête de la page d'import de tickets
 *
 * Props :
 *  - isLight           : boolean
 *  - textPrimary       : string
 *  - textSecondary     : string
 *  - selectedHotspotId : string
 *  - onBack            : fn()
 */
export default function TicketNewHeader({ isLight, textPrimary, textSecondary, selectedHotspotId, onBack }) {
  return (
    <div className="flex items-center gap-4 relative">
      <button
        onClick={onBack}
        className={cn(
          'p-2.5 rounded-xl transition-all shrink-0',
          isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400',
          'hover:scale-105 active:scale-95',
        )}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center',
          isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400',
        )}>
          <TicketIcon />
        </div>
        <div>
          <h1 className={cn('text-2xl font-black tracking-tight', textPrimary)}>
            Importer des tickets
          </h1>
          <p className={cn('text-sm mt-0.5', textSecondary)}>
            Ajoutez des tickets utilisateurs WiFi pour un hotspot
          </p>
        </div>
      </div>
    </div>
  )
}

/** Mini composant icône Ticket */
function TicketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
      <path d="M9 13a3 3 0 0 0 6 0" />
    </svg>
  )
}
