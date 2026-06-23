import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { cn } from '../../../utils/cn'

/**
 * RevokeConfirmModal — Confirmation de révocation de token
 *
 * Props :
 *  - open         : boolean
 *  - onClose      : fn()
 *  - onConfirm    : fn()
 *  - hotspotName  : string
 *  - isLight      : boolean
 */
export default function RevokeConfirmModal({ open, onClose, onConfirm, hotspotName, isLight }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.25 }}
            className={cn('relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800')}
          >
            <div className={cn('flex items-center gap-3 px-7 pt-6 pb-4 border-b', isLight ? 'border-slate-100' : 'border-slate-800')}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isLight ? 'bg-red-50' : 'bg-red-500/10')}>
                <AlertTriangle className={cn('w-5 h-5', isLight ? 'text-red-600' : 'text-red-400')} />
              </div>
              <div>
                <h2 className={cn('text-base font-bold', isLight ? 'text-slate-900' : 'text-white')}>Révoquer le token</h2>
                <p className={cn('text-xs', isLight ? 'text-slate-500' : 'text-slate-400')}>{hotspotName || 'Sans nom'}</p>
              </div>
              <button onClick={onClose} className={cn('ml-auto p-2 rounded-xl transition-all', isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-800 text-slate-500')}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-7 py-5">
              <p className={cn('text-sm leading-relaxed', isLight ? 'text-slate-600' : 'text-slate-300')}>
                Êtes-vous sûr de vouloir révoquer ce token ? Cette action est irréversible et vous devrez en générer un nouveau pour reconnecter votre routeur.
              </p>
            </div>

            <div className={cn('px-7 py-4 border-t flex items-center justify-end gap-3', isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-900/50')}>
              <button onClick={onClose} className={cn('h-10 px-5 rounded-xl text-sm font-semibold transition-all', isLight ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700/50')}>
                Annuler
              </button>
              <button onClick={onConfirm} className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all bg-red-600 text-white hover:bg-red-500">
                <Trash2 className="w-4 h-4" />
                Révoquer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
