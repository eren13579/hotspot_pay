import { cn } from '../../utils/cn'

/**
 * SessionsStatusFilter — Filtre par statut de session (Tous / Actives / Expirées / Révoquées)
 *
 * Props :
 *  - value    : string ('' | 'ACTIVE' | 'EXPIRED' | 'REVOKED')
 *  - onChange : fn(value)
 *  - isLight  : boolean
 */
export const SESSION_STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'ACTIVE', label: 'Actives' },
  { value: 'PENDING_MIKROTIK', label: 'En attente' },
  { value: 'EXPIRED', label: 'Expirées' },
  { value: 'REVOKED', label: 'Révoquées' },
]

export default function SessionsStatusFilter({ value, onChange, isLight }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {SESSION_STATUS_FILTERS.map((f) => (
        <button key={f.value}
          onClick={() => onChange(f.value)}
          className={cn(
            'h-7 px-3 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap',
            value === f.value
              ? 'bg-blue-600 text-white shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
              : isLight ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
          )}>
          {f.label}
        </button>
      ))}
    </div>
  )
}
