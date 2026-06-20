/* eslint-disable react-refresh/only-export-components */
import { cn } from '../../utils/cn'

export const HOTSPOT_STATUS_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'ONLINE', label: 'En ligne' },
  { key: 'OFFLINE', label: 'Hors ligne' },
  { key: 'NEVER', label: 'Jamais' },
  { key: 'NO_TOKEN', label: 'Non configuré' },
]

/**
 * HotspotStatusFilter — Barre de filtres par statut hotspot (desktop) + select mobile
 *
 * Props :
 *  - value    : string (requis)
 *  - onChange : fn(key) (requis)
 *  - isLight  : boolean (requis)
 */
export default function HotspotStatusFilter({ value, onChange, isLight }) {
  return (
    <>
      {/* Desktop */}
      <div className={cn(
        'hidden sm:flex items-center p-0.5 rounded-xl border overflow-x-auto',
        isLight ? 'border-slate-200 bg-white' : 'border-slate-700/50 bg-slate-900',
      )}>
        {HOTSPOT_STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              'flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap',
              value === key
                ? 'bg-blue-600 text-white shadow-sm'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mobile */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'sm:hidden h-9 px-3 rounded-xl text-xs font-semibold outline-none transition-all',
          isLight ? 'border border-slate-200 bg-white text-slate-600' : 'border border-slate-700/50 bg-slate-900 text-slate-400',
        )}
      >
        {HOTSPOT_STATUS_FILTERS.map(({ key, label }) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </>
  )
}
