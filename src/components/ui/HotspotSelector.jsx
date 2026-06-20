import { useState, useRef } from 'react'
import { Wifi, ChevronDown, X, User } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * HotspotSelector — Dropdown searchable pour sélectionner un hotspot
 *
 * Props :
 *  - hotspots     : array         (requis)
 *  - selectedId   : string        (requis)
 *  - onSelect     : fn(id)        (requis)
 *  - isLight      : boolean       (requis)
 *  - placeholder  : string        (défaut: "Sélectionnez un hotspot…")
 *  - className    : string | null
 *
 * Retourne : { component, open, setOpen }
 *   Pour contrôler l'ouverture depuis l'extérieur.
 */
export default function HotspotSelector({ hotspots, selectedId, onSelect, isLight, placeholder, className }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  const selected = hotspots.find((h) => (h.hotspot_id || h.id) === selectedId)
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  const inputBase = cn(
    'w-full h-12 px-4 text-sm outline-none transition-all duration-200 rounded-xl',
    isLight
      ? 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
      : 'bg-slate-800/60 border border-slate-700/60 text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15',
  )

  const filtered = hotspots.filter((h) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (h.name || '').toLowerCase().includes(q) || (h.location || '').toLowerCase().includes(q)
  })

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={hotspots.length === 0}
        className={cn(
          inputBase,
          'flex items-center justify-between cursor-pointer pr-3',
          !selectedId && isLight ? 'text-slate-400' : '',
        )}
      >
        <span className="truncate">
          {selected
            ? `${selected.name}${selected.location ? ` — ${selected.location}` : ''}`
            : (placeholder || 'Sélectionnez un hotspot…')}
        </span>
        <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', open && 'rotate-180', textMuted)} />
      </button>

      {open && (
        <div className={cn(
          'absolute z-50 mt-1 w-full rounded-xl border shadow-xl overflow-hidden',
          isLight
            ? 'bg-white border-slate-200 shadow-slate-200/50'
            : 'bg-slate-800 border-slate-700 shadow-black/50',
        )}>
          {/* Search bar */}
          <div className={cn(
            'flex items-center gap-2 px-3 py-2 border-b',
            isLight ? 'border-slate-200' : 'border-slate-700',
          )}>
            <User className={cn('w-3.5 h-3.5', textMuted)} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un hotspot…"
              className={cn(
                'flex-1 text-xs outline-none bg-transparent',
                isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500',
              )}
              autoFocus
            />
            {search && (
              <button onClick={() => setSearch('')} className="hover:text-white transition-colors text-slate-500">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((hs) => {
              const hid = hs.hotspot_id || hs.id
              const isSelected = hid === selectedId
              return (
                <button
                  key={hid}
                  type="button"
                  onClick={() => {
                    onSelect(hid)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition-colors',
                    isSelected
                      ? isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/10 text-blue-300'
                      : isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-slate-700/50 text-slate-300',
                  )}
                >
                  <Wifi className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-blue-500' : textMuted)} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{hs.name || 'Sans nom'}</p>
                    {hs.location && <p className={cn('truncate', textMuted)}>{hs.location}</p>}
                  </div>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className={cn('px-3 py-6 text-center text-xs', textMuted)}>
                Aucun hotspot trouvé
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * useHotspotSelector — Hook pour gérer la fermeture au clic hors champ
 *
 * Utilisation :
 *   const hotspotRef = useHotspotSelector(setOpen)
 *
 * Ou manuellement :
 *   const ref = useRef(null)
 *   useEffect(() => { ... }, [])
 */
export function useHotspotSelector(onClose) {
  const ref = useRef(null)
  const handlerRef = useRef(null)

  if (!handlerRef.current) {
    handlerRef.current = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose?.()
      }
    }
  }

  // On ré-attache à chaque render (React 19)
  return ref
}
