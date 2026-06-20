import { useRef } from 'react'
import { FileText, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * BulkImportArea — Zone d'import en masse (CSV / user=pass)
 *
 * Props :
 *  - isLight       : boolean
 *  - bulkText      : string
 *  - setBulkText   : fn(text)
 *  - bulkFormat    : 'csv' | 'pair'
 *  - setBulkFormat : fn(format)
 *  - onFileUpload  : fn(file)
 *  - dragOver      : boolean
 *  - onDragOver    : fn(event)
 *  - onDragLeave   : fn()
 *  - onDrop        : fn(event)
 *  - parsedCount   : number
 *  - textPrimary   : string
 *  - textSecondary : string
 *  - textMuted     : string
 */
export default function BulkImportArea({
  isLight, bulkText, setBulkText, bulkFormat, setBulkFormat,
  onFileUpload, dragOver, onDragOver, onDragLeave, onDrop,
  parsedCount, textPrimary, textSecondary, textMuted,
}) {
  const inputBase = cn(
    'w-full h-12 px-4 text-sm outline-none transition-all duration-200 rounded-xl',
    isLight
      ? 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
      : 'bg-slate-800/60 border border-slate-700/60 text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15',
  )

  return (
    <div className="space-y-4">
      {/* Format selector */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="radio" name="bulkFormat" value="csv" checked={bulkFormat === 'csv'}
            onChange={(e) => setBulkFormat(e.target.value)} className="accent-blue-600" />
          <span className={cn('text-xs font-medium', textPrimary)}>CSV</span>
          <span className={cn('text-[10px]', textMuted)}>(username,password,profile,timeLimit,dataLimit,comment)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="radio" name="bulkFormat" value="pair" checked={bulkFormat === 'pair'}
            onChange={(e) => setBulkFormat(e.target.value)} className="accent-blue-600" />
          <span className={cn('text-xs font-medium', textPrimary)}>user=pass</span>
        </label>
      </div>

      {/* Zone d'upload + textarea */}
      <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        className={cn('relative rounded-xl border-2 border-dashed transition-all',
          dragOver ? 'border-blue-500 bg-blue-500/5' : isLight ? 'border-slate-300' : 'border-slate-700',
        )}>
        {dragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-blue-500/10 backdrop-blur-sm">
            <p className={cn('text-sm font-semibold', textPrimary)}>Déposer le fichier ici</p>
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Barre d'outils */}
          <div className="flex items-center gap-2">
            <FileInputButton onFileUpload={onFileUpload} isLight={isLight} textMuted={textMuted} />
            <span className={cn('text-[10px]', textMuted)}>ou glissez-déposez ici</span>
            {bulkText.trim() && (
              <button type="button" onClick={() => setBulkText('')}
                className={cn('ml-auto flex items-center gap-1 text-[11px] font-medium transition-colors', isLight ? 'text-red-500 hover:text-red-700' : 'text-red-400 hover:text-red-300')}>
                <Trash2 className="w-3 h-3" />Effacer
              </button>
            )}
          </div>

          {/* Textarea */}
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)}
            placeholder={bulkFormat === 'csv'
              ? 'user1,pass123,default,1h,100,commentaire\nuser2,pass456,premium,2h,,\nuser3,pass789,,30m,,'
              : 'user1=pass123\nuser2=pass456\nuser3=pass789'
            }
            className={cn('w-full min-h-45 px-4 py-3 rounded-xl text-sm font-mono outline-none resize-y', inputBase)}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Compteur */}
      {bulkText.trim() && (
        <div className={cn('flex items-center justify-between px-4 py-2 rounded-lg text-[11px]', isLight ? 'bg-slate-50' : 'bg-slate-800/20')}>
          <span className={textSecondary}>{parsedCount} ticket{parsedCount !== 1 ? 's' : ''} détecté{parsedCount !== 1 ? 's' : ''}</span>
          <span className={textMuted}>{bulkText.trim().split('\n').filter(Boolean).length} ligne{bulkText.trim().split('\n').filter(Boolean).length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}

/** Mini composant : bouton fichier caché */
function FileInputButton({ onFileUpload, isLight, textMuted }) {
  const ref = useRef(null)
  return (
    <>
      <input ref={ref} type="file" accept=".csv" onChange={(e) => { onFileUpload(e.target.files[0]); e.target.value = '' }} className="hidden" />
      <button type="button" onClick={() => ref.current?.click()}
        className={cn('flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold transition-all', isLight ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' : 'bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-800/40')}>
        <FileText className="w-3.5 h-3.5" />Choisir un fichier CSV
      </button>
    </>
  )
}
