import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Pagination — Navigation de pages avec boutons prev/next + numéros
 *
 * Props :
 *  - page        : number (0-indexed, requis)
 *  - totalPages  : number (requis)
 *  - onChange    : fn(newPage) (requis)
 *  - isLight     : boolean (requis)
 *  - label       : string | null ("Page X sur Y")
 */
export default function Pagination({ page, totalPages, onChange, isLight, label }) {
  if (totalPages <= 1) return null

  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className={cn(
      'flex items-center justify-between px-6 py-3 border-t',
      isLight ? 'border-slate-200' : 'border-slate-800',
    )}>
      {label !== false && (
        <p className={cn('text-[10px]', textMuted)}>
          {label || `Page ${page + 1} sur ${totalPages}`}
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all disabled:opacity-30',
            isLight
              ? 'text-slate-600 hover:bg-slate-100'
              : 'text-slate-400 hover:bg-slate-800/50',
          )}
        >
          <ChevronLeft className="w-3 h-3" />
          Précédent
        </button>

        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={cn(
              'w-7 h-7 rounded-lg text-[11px] font-semibold transition-all',
              page === i
                ? 'bg-blue-600 text-white'
                : isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-slate-800/50',
            )}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
          disabled={page === totalPages - 1}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all disabled:opacity-30',
            isLight
              ? 'text-slate-600 hover:bg-slate-100'
              : 'text-slate-400 hover:bg-slate-800/50',
          )}
        >
          Suivant
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
