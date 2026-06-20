import { cn } from '../../utils/cn'

export const TICKET_STATUS_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'AVAILABLE', label: 'Disponibles' },
  { key: 'USED', label: 'Utilisés' },
  { key: 'EXPIRED', label: 'Expirés' },
  { key: 'REVOKED', label: 'Révoqués' },
]

/**
 * StatusFilter — Barre de filtres par statut de ticket
 *
 * Props :
 *  - value    : string (requis) — clé du filtre actif
 *  - onChange : fn(key) (requis)
 *  - isLight  : boolean (requis)
 */
export default function StatusFilter({ value, onChange, isLight }) {
  return (
    <div className={cn(
      'flex items-center p-0.5 rounded-xl border overflow-x-auto',
      isLight ? 'border-slate-200 bg-white' : 'border-slate-700/50 bg-slate-900',
    )}>
      {TICKET_STATUS_FILTERS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'h-8 px-2.5 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap',
            value === key
              ? 'bg-blue-600 text-white shadow-sm'
              : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
