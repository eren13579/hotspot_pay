import { Ban, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * BulkActionsBar — Barre d'actions groupées (révoquer/supprimer)
 *
 * Props :
 *  - isLight      : boolean (requis)
 *  - selectedCount : number (requis)
 *  - processing   : boolean (requis)
 *  - onRevoke     : fn() (requis)
 *  - onDelete     : fn() (requis)
 *  - onClear      : fn() (requis)
 */
export default function BulkActionsBar({ isLight, selectedCount, processing, onRevoke, onDelete, onClear }) {
  return (
    <div className={cn(
      'flex items-center gap-3 px-6 py-3 border-b',
      isLight ? 'bg-blue-50 border-slate-200' : 'bg-blue-500/5 border-slate-800',
    )}>
      <div className={cn(
        'flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-bold',
        isLight ? 'bg-blue-200 text-blue-700' : 'bg-blue-500/20 text-blue-300',
      )}>
        {selectedCount}
      </div>
      <p className={cn('text-xs font-medium', isLight ? 'text-blue-700' : 'text-blue-300')}>
        ticket{selectedCount !== 1 ? 's' : ''} sélectionné{selectedCount !== 1 ? 's' : ''}
      </p>
      <div className="flex-1" />
      <button
        onClick={onRevoke}
        disabled={processing}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold bg-amber-600 text-white hover:bg-amber-500 transition-all disabled:opacity-50"
      >
        <Ban className="w-3 h-3" />
        Révoquer
      </button>
      <button
        onClick={onDelete}
        disabled={processing}
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
