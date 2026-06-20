import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '../../../utils/cn'

/**
 * UrlField — Champ URL avec bouton copier
 *
 * Props :
 *  - label     : string (requis)
 *  - url       : string (requis)
 *  - isLight   : boolean (requis)
 *  - icon      : composant lucide-react (requis)
 */
export default function UrlField({ label, url, isLight, icon: Icon }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }
  return (
    <div>
      <label className={cn('text-[11px] font-semibold uppercase tracking-widest mb-2 block', isLight ? 'text-slate-500' : 'text-slate-500')}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <code className={cn('flex-1 px-4 py-3 rounded-xl text-xs font-mono break-all select-all', isLight ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-800 text-slate-200 border border-slate-700')}>
          {url || 'Non défini'}
        </code>
        {url && (
          <button onClick={copy} className={cn('flex items-center justify-center h-11 w-11 rounded-xl transition-all shrink-0', copied ? 'bg-emerald-600 text-white' : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}
