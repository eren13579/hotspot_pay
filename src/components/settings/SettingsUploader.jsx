import { useState, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Upload, X, Image, Loader2, FileImage } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { adminSettingsApi } from '../../api/endpoints'

/**
 * Uploader drag & drop avec preview — design PRO MAX
 * Lit le thème depuis Redux automatiquement
 *
 * Props : section ('logo'|'favicon'|'about'), currentUrl, onUploaded(url), label, accept
 */
export default function SettingsUploader({ section, currentUrl, onUploaded, label, accept }) {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'

  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  const handleUpload = useCallback(async (file) => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('section', section)
      const { data } = await adminSettingsApi.upload(formData)
      if (data?.success && data?.data?.url) {
        onUploaded(data.data.url)
      }
    } catch {
      // toast handled by parent
    } finally {
      setUploading(false)
      URL.revokeObjectURL(objectUrl)
      setPreview(null)
    }
  }, [section, onUploaded])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
    e.target.value = ''
  }, [handleUpload])

  const displayedUrl = preview || currentUrl

  const borderCls = dragOver
    ? 'border-amber-400 bg-amber-500/10'
    : isLight
      ? 'border-slate-200 hover:border-amber-300'
      : 'border-slate-700/50 hover:border-amber-600/50'

  return (
    <div className="space-y-2">
      {label && (
        <p className={cn('text-xs font-medium', isLight ? 'text-slate-600' : 'text-slate-400')}>{label}</p>
      )}

      {/* Zone de drop / preview */}
      <motion.div
        whileTap={{ scale: 0.99 }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
          borderCls,
          isLight ? 'bg-slate-50/50' : 'bg-slate-800/20',
        )}
      >
        {uploading ? (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            <span className="text-[11px] text-amber-400 font-medium">Upload en cours…</span>
          </motion.div>
        ) : displayedUrl ? (
          <div className="relative group">
            <img
              src={displayedUrl}
              alt={label || 'Aperçu'}
              className="max-h-24 max-w-48 rounded-lg object-contain transition-all duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-slate-900/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[11px] text-white font-medium flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Cliquer pour changer
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              isLight ? 'bg-slate-100' : 'bg-slate-800 border border-slate-700/50',
            )}>
              <FileImage className={cn('w-6 h-6', isLight ? 'text-slate-400' : 'text-slate-500')} />
            </div>
            <span className={cn('text-sm font-medium', isLight ? 'text-slate-600' : 'text-slate-300')}>
              Déposer un fichier ici
            </span>
            <span className={cn('text-[11px]', textMuted)}>
              ou cliquez pour parcourir
            </span>
            <span className={cn('text-[10px] px-2 py-0.5 rounded-full', isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-500')}>
              PNG, JPG, SVG, WebP — max 5 Mo
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept || 'image/png,image/jpeg,image/svg+xml,image/webp,image/gif'}
          onChange={handleChange}
          className="hidden"
        />
      </motion.div>

      {/* URL actuelle */}
      {currentUrl && !uploading && (
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          isLight ? 'bg-slate-50' : 'bg-slate-800/30',
        )}>
          <Image className={cn('w-3 h-3 shrink-0', textMuted)} />
          <span className={cn('text-[10px] font-mono truncate flex-1', textMuted)}>{currentUrl}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onUploaded('') }}
            className={cn(
              'p-1 rounded-lg transition-colors',
              isLight ? 'hover:bg-red-50 text-red-400 hover:text-red-600' : 'hover:bg-red-500/10 text-red-400',
            )}
            title="Supprimer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
