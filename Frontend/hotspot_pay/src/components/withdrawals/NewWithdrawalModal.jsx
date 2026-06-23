import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../utils/cn'

const OPERATORS = [
  { value: 'MTN_MOMO', label: 'MTN Mobile Money' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'CAMPAY', label: 'CAMPAY' },
  { value: 'MONEROO', label: 'MONEROO' },
]

/**
 * NewWithdrawalModal — Modal de demande de retrait
 *
 * Props :
 *  - open        : boolean
 *  - onClose     : fn()
 *  - onSubmit    : fn({ amount, currency, recipientPhone, operator })
 *  - submitting  : boolean
 *  - isLight     : boolean
 *  - textPrimary : string
 *  - textSecondary : string
 */
export default function NewWithdrawalModal({ open, onClose, onSubmit, submitting, isLight, textPrimary, textSecondary }) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('XAF')
  const [phone, setPhone] = useState('')
  const [operator, setOperator] = useState('MTN_MOMO')

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.error('Montant invalide')
      return
    }
    if (!phone) {
      toast.error('Numéro de téléphone requis')
      return
    }
    if (!operator) {
      toast.error('Opérateur requis')
      return
    }
    onSubmit({ amount: Number(amount), currency, recipientPhone: phone, operator })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={cn('w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden',
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800')}
          >
            {/* Header */}
            <div className={cn('flex items-center justify-between px-6 py-4 border-b',
              isLight ? 'border-slate-200' : 'border-slate-800')}>
              <h2 className={cn('text-base font-bold', textPrimary)}>Nouveau retrait</h2>
              <button onClick={handleClose} disabled={submitting}
                className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40',
                  isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800')}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Montant</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                  className={cn('w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border',
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400' : 'bg-slate-800/50 border-slate-700 text-white focus:border-blue-500')} />
              </div>

              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Devise</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className={cn('w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border cursor-pointer',
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400' : 'bg-slate-800/50 border-slate-700 text-white focus:border-blue-500')}>
                  <option value="XAF">XAF</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Numéro de réception</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XXX XXX"
                  className={cn('w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border',
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400' : 'bg-slate-800/50 border-slate-700 text-white focus:border-blue-500')} />
              </div>

              <div>
                <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Opérateur</label>
                <select value={operator} onChange={(e) => setOperator(e.target.value)}
                  className={cn('w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border cursor-pointer',
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400' : 'bg-slate-800/50 border-slate-700 text-white focus:border-blue-500')}>
                  {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <button onClick={handleSubmit} disabled={submitting}
                className={cn('w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50',
                  isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')}>
                {submitting ? 'Traitement...' : 'Demander le retrait'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
