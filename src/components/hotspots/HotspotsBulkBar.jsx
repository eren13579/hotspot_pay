import { Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * HotspotsBulkBar — Barre d'actions groupées (suppression)
 *
 * Props :
 *  - isLight        : boolean (requis)
 *  - selectedCount  : number (requis)
 *  - deleting       : boolean (requis)
 *  - onDelete       : fn() (requis)
 *  - onClear        : fn() (requis)
 */
export default function HotspotsBulkBar({ isLight, selectedCount, deleting, onDelete, onClear }) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-6 py-2.5 border-b',
      isLight ? 'bg-red-50 border-slate-200' : 'bg-red-500/5 border-slate-800',
    )}>
      <p className={cn('text-xs font-medium', isLight ? 'text-red-700' : 'text-red-400')}>
        {selectedCount} hotspot{selectedCount !== 1 ? 's' : ''} sélectionné{selectedCount !== 1 ? 's' : ''}
      </p>
      <div className="flex-1" />
      <button
        onClick={onDelete}
        disabled={deleting}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold bg-red-600 text-white hover:bg-red-500 transition-all disabled:opacity-50"
      >
        <Trash2 className="w-3 h-3" />
        Supprimer
      </button>
      <button
        onClick={onClear}
        className={cn(
          'text-[11px] font-medium transition-colors',
          isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white',
        )}
      >
        Annuler
      </button>
    </div>
  )
}
