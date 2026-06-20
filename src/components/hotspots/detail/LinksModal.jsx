import { motion, AnimatePresence } from 'framer-motion'
import { Globe, X, Activity } from 'lucide-react'
import { cn } from '../../../utils/cn'
import UrlField from './UrlField'

/**
 * LinksModal — Modal affichant les URLs (portail captif + polling)
 *
 * Props :
 *  - open           : boolean
 *  - onClose        : fn()
 *  - portalLink     : string
 *  - savedPollingUrl : string
 *  - hotspotName    : string
 *  - isLight        : boolean
 */
export default function LinksModal({ open, onClose, portalLink, savedPollingUrl, hotspotName, isLight }) {
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
            className={cn('relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800')}
          >
            <div className={cn('flex items-center gap-3 px-7 pt-6 pb-4 border-b', isLight ? 'border-slate-100' : 'border-slate-800')}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isLight ? 'bg-blue-50' : 'bg-blue-500/10')}>
                <Globe className={cn('w-5 h-5', isLight ? 'text-blue-600' : 'text-blue-400')} />
              </div>
              <div>
                <h2 className={cn('text-base font-bold', isLight ? 'text-slate-900' : 'text-white')}>URLs du hotspot</h2>
                <p className={cn('text-xs', isLight ? 'text-slate-500' : 'text-slate-400')}>{hotspotName || 'Sans nom'}</p>
              </div>
              <button onClick={onClose} className={cn('ml-auto p-2 rounded-xl transition-all', isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-800 text-slate-500')}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-7 py-5 space-y-4">
              {portalLink && <UrlField label="URL du portail captif" url={portalLink} isLight={isLight} icon={Globe} />}
              {savedPollingUrl && <UrlField label="URL de polling" url={savedPollingUrl} isLight={isLight} icon={Activity} />}
              {!portalLink && !savedPollingUrl && (
                <p className={cn('text-xs text-center py-6', isLight ? 'text-slate-400' : 'text-slate-500')}>
                  Aucune URL sauvegardée pour le moment.<br />
                  Générez un token pour obtenir les URLs du portail et de polling.
                </p>
              )}
            </div>

            <div className={cn('px-7 py-4 border-t flex justify-end', isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-900/50')}>
              <button onClick={onClose} className={cn('h-10 px-5 rounded-xl text-sm font-semibold transition-all', isLight ? 'bg-white border border-slate-200 text-slate-600' : 'bg-slate-800 border border-slate-700 text-slate-300')}>
                Fermer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
