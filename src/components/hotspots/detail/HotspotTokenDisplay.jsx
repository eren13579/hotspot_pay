import { useState } from 'react'
import { RefreshCw, Download, Check, Copy } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../../utils/cn'

/**
 * HotspotTokenDisplay — Affichage du token avec copie et téléchargement
 *
 * Props :
 *  - isLight       : boolean
 *  - storedToken   : string
 *  - routerToken   : string
 *  - downloading   : boolean
 *  - onDownload    : fn()
 */
export default function HotspotTokenDisplay({ isLight, storedToken, routerToken, downloading, onDownload }) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const token = storedToken || routerToken
  const [tokenCopied, setTokenCopied] = useState(false)

  if (!token) return null

  const copyToken = () => {
    navigator.clipboard.writeText(token)
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cn('rounded-2xl p-6', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800')}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn('text-sm font-bold', textPrimary)}>Token du routeur</h3>
        <button
          onClick={onDownload}
          disabled={downloading}
          className={cn('flex items-center gap-1.5 h-8 px-3 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50', isLight ? 'text-emerald-600 hover:bg-emerald-50' : 'text-emerald-400 hover:bg-emerald-500/10')}
          title="Télécharger le script"
        >
          {downloading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{downloading ? 'Téléchargement...' : 'Script'}</span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <code className={cn('flex-1 px-4 py-2.5 rounded-xl text-xs font-mono break-all select-all', isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300 border border-slate-700')}>
          {token}
        </code>
        <button
          onClick={copyToken}
          className={cn('flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold transition-all shrink-0', tokenCopied ? 'bg-emerald-600 text-white' : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')}
        >
          {tokenCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {tokenCopied ? 'Copié' : 'Copier'}
        </button>
      </div>
    </motion.div>
  )
}
