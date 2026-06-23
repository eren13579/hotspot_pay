import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirmer',
  message = 'Êtes-vous sûr de vouloir continuer ?',
  confirmLabel = 'Confirmer',
  confirmClass,
  loading = false,
  icon: Icon = AlertTriangle,
  iconBg,
  iconColor,
  delay = 0, // délai de sécurité en secondes
}) {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'
  const [countdown, setCountdown] = useState(0)
  const canConfirm = countdown <= 0

  useEffect(() => {
    if (open && delay > 0) {
      setCountdown(delay)
      const id = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) { clearInterval(id); return 0 }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(id)
    } else if (!open) {
      setCountdown(0)
    }
  }, [open, delay])

  const iconBgCls = iconBg ?? (isLight ? 'bg-red-50' : 'bg-red-500/10')
  const iconColorCls = iconColor ?? (isLight ? 'text-red-500' : 'text-red-400')

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'relative w-full max-w-sm rounded-2xl p-6 shadow-2xl',
              isLight ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800',
            )}
          >
            <div className="flex flex-col items-center text-center">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', iconBgCls)}>
                <Icon className={cn('w-6 h-6', iconColorCls)} />
              </div>

              <h3 className={cn('text-base font-bold mb-2', isLight ? 'text-slate-900' : 'text-white')}>
                {title}
              </h3>
              <p className={cn('text-xs mb-6 max-w-xs', isLight ? 'text-slate-500' : 'text-slate-400')}>
                {message}
              </p>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className={cn(
                    'flex-1 h-10 rounded-xl text-xs font-semibold transition-all',
                    isLight
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
                    loading && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  Annuler
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading || !canConfirm}
                  className={cn(
                    'flex-1 h-10 rounded-xl text-xs font-semibold transition-all disabled:opacity-50',
                    confirmClass || 'bg-red-600 text-white hover:bg-red-500',
                  )}
                >
                  {loading ? 'Suppression...' : !canConfirm ? `Confirmer (${countdown}s)` : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
