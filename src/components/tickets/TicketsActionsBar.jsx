import { useState, useRef, useEffect } from 'react'
import { Wifi, ChevronDown, Search, X, Download, RefreshCw, Plus } from 'lucide-react'
import { cn } from '../../utils/cn'
import ScopeToggle from '../ui/ScopeToggle'
import StatusFilter from './StatusFilter'

/**
 * TicketsActionsBar — Barre d'actions complète (filtres, export, scope, import)
 *
 * Props :
 *  - isLight            : boolean
 *  - hotspots           : array
 *  - selectedHotspotId  : string
 *  - selectedHotspot    : object | null
 *  - onHotspotSelect    : fn(id)
 *  - statusFilter       : string
 *  - onStatusFilterChange : fn(key)
 *  - showExport         : boolean
 *  - onExport           : fn()
 *  - refreshing         : boolean
 *  - onRefresh          : fn()
 *  - isAdmin            : boolean
 *  - scope              : 'global' | 'self'
 *  - onScopeChange      : fn(scope)
 *  - onImport           : fn()
 *  - inputBase          : string
 */
export default function TicketsActionsBar({
  isLight, hotspots, selectedHotspotId, selectedHotspot,
  onHotspotSelect, statusFilter, onStatusFilterChange,
  showExport, onExport, refreshing, onRefresh,
  isAdmin, scope, onScopeChange, onImport, inputBase,
}) {
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const [hotspotOpen, setHotspotOpen] = useState(false)
  const [hotspotSearch, setHotspotSearch] = useState('')
  const hotspotRef = useRef(null)

  // Fermeture au clic extérieur
  useEffect(() => {
    const handle = (e) => {
      if (hotspotRef.current && !hotspotRef.current.contains(e.target)) {
        setHotspotOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const filtered = hotspots.filter((h) => {
    if (!hotspotSearch) return true
    const q = hotspotSearch.toLowerCase()
    return (h.name || '').toLowerCase().includes(q) || (h.location || '').toLowerCase().includes(q)
  })

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      {/* Groupe gauche : sélecteur, filtres, actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Hotspot selector (compact) */}
      <div className="relative" ref={hotspotRef}>
        <button
          type="button"
          onClick={() => setHotspotOpen(!hotspotOpen)}
          className={cn(
            'flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-semibold transition-all max-w-45',
            inputBase?.replace('w-full', '') || '',
          )}
        >
          <Wifi className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{selectedHotspot?.name || 'Hotspot'}</span>
          <ChevronDown className={cn('w-3 h-3 shrink-0 transition-transform', hotspotOpen && 'rotate-180')} />
        </button>

        {hotspotOpen && (
          <DropdownPanel
            hotspots={filtered}
            search={hotspotSearch}
            setSearch={setHotspotSearch}
            selectedId={selectedHotspotId}
            onSelect={(id) => {
              onHotspotSelect(id)
              setHotspotOpen(false)
              setHotspotSearch('')
            }}
            isLight={isLight}
            textMuted={textMuted}
          />
        )}
      </div>

      {/* Filtre statut */}
      <StatusFilter value={statusFilter} onChange={onStatusFilterChange} isLight={isLight} />

      {/* Export CSV — PRO+ */}
      {showExport && (
        <button
          onClick={onExport}
          className={cn(
            'flex items-center gap-1.5 h-10 px-3 rounded-xl text-[11px] font-semibold transition-all',
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

      {/* Scope toggle (admin uniquement) */}
      {isAdmin && (
        <ScopeToggle scope={scope} onChange={onScopeChange} isLight={isLight} size="sm" />
      )}
      </div>{/* Fin groupe gauche */}

      {/* Groupe droit : Refresh + Importer */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(
            'flex items-center justify-center h-10 w-10 rounded-xl transition-all',
            isLight
              ? 'text-slate-400 hover:bg-slate-100 border border-slate-200 bg-white'
              : 'text-slate-500 hover:bg-slate-800 border border-slate-700/50 bg-slate-900',
          )}
          title="Rafraîchir"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
        </button>
        <button
          onClick={onImport}
          className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Importer</span>
        </button>
      </div>{/* Fin groupe droit */}
    </div>
  )
}

/* ── Dropdown de sélection compact ───────────────────────────── */
function DropdownPanel({ hotspots, search, setSearch, selectedId, onSelect, isLight, textMuted }) {
  return (
    <div className={cn(
      'absolute z-50 mt-1 min-w-55 rounded-xl border shadow-xl overflow-hidden',
      isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-800 border-slate-700 shadow-black/50',
    )}>
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 border-b',
        isLight ? 'border-slate-200' : 'border-slate-700',
      )}>
        <Search className={cn('w-3.5 h-3.5', textMuted)} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Chercher…"
          className={cn('flex-1 text-xs outline-none bg-transparent', isLight ? 'text-slate-900' : 'text-white')}
          autoFocus
        />
        {search && (
          <button onClick={() => setSearch('')} className={cn('hover:text-white transition-colors', textMuted)}>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="max-h-52 overflow-y-auto">
        {hotspots.map((hs) => {
          const hid = hs.hotspot_id || hs.id
          const sel = hid === selectedId
          return (
            <button
              key={hid}
              type="button"
              onClick={() => onSelect(hid)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition-colors',
                sel
                  ? isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/10 text-blue-300'
                  : isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-slate-700/50 text-slate-300',
              )}
            >
              <Wifi className={cn('w-3.5 h-3.5 shrink-0', sel ? 'text-blue-500' : textMuted)} />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{hs.name || 'Sans nom'}</p>
                {hs.location && <p className={cn('truncate', textMuted)}>{hs.location}</p>}
              </div>
              {sel && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
            </button>
          )
        })}
        {hotspots.length === 0 && (
          <div className={cn('px-3 py-6 text-center text-xs', textMuted)}>Aucun hotspot trouvé</div>
        )}
      </div>
    </div>
  )
}
