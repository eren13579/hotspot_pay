import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

/**
 * NetworkErrorBanner — Bannière d'erreur réseau avec bouton fermer
 */
export default function NetworkErrorBanner({ message, onClose, isLight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl text-xs',
        isLight ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-red-500/10 border border-red-500/20 text-red-300',
      )}
    >
      <X className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold">Erreur réseau</p>
        <p className={cn('mt-0.5', isLight ? 'text-red-600' : 'text-red-400')}>{message}</p>
      </div>
      <button
        onClick={onClose}
        className={cn('p-1 rounded-lg transition-colors shrink-0', isLight ? 'hover:bg-red-100' : 'hover:bg-red-500/20')}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}
