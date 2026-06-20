import { ArrowLeft, Wifi, RefreshCw, Zap, Shield, Pencil, Trash2 } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { HOTSPOT_STATUS_STYLE, HOTSPOT_STATUS_LABEL } from '../../ui/StatusBadge'

/**
 * HotspotDetailHeader — En-tête de la page détail hotspot
 *
 * Props :
 *  - isLight        : boolean
 *  - hotspot        : object
 *  - refreshing     : boolean
 *  - onRefresh      : fn()
 *  - onBack         : fn()
 *  - planLevel      : number
 *  - testing        : boolean
 *  - onTest         : fn()
 *  - hasToken       : boolean
 *  - storedToken    : string
 *  - generating     : boolean
 *  - onGenerateToken : fn()
 *  - onEdit         : fn()
 *  - deleting       : boolean
 *  - onDelete       : fn()
 */
export default function HotspotDetailHeader({
  isLight, hotspot, refreshing, onRefresh, onBack,
  planLevel, testing, onTest,
  hasToken, storedToken, generating, onGenerateToken,
  onEdit, deleting, onDelete,
}) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const h = hotspot || {}
  const status = h.status || 'NO_TOKEN'
  const tokenActive = hasToken || !!storedToken

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onBack} className={cn('p-2 rounded-xl transition-colors shrink-0', isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400')}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', isLight ? 'bg-blue-50' : 'bg-blue-500/10')}>
          <Wifi className={cn('w-6 h-6', isLight ? 'text-blue-600' : 'text-blue-400')} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className={cn('text-xl font-bold tracking-tight truncate', textPrimary)}>
              {h.name || 'Sans nom'}
            </h1>
            <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-medium', HOTSPOT_STATUS_STYLE[status])}>
              {status === 'ONLINE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              {status === 'OFFLINE' && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
              {status === 'NEVER' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
              {status === 'NO_TOKEN' && <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
              {HOTSPOT_STATUS_LABEL[status]}
            </span>
          </div>
          <p className={cn('text-xs mt-0.5', textSecondary)}>
            {h.location || 'Localisation non définie'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={onRefresh} className={cn('flex items-center justify-center h-9 w-9 rounded-xl text-xs transition-all', isLight ? 'text-slate-400 hover:bg-slate-100 border border-slate-200 bg-white' : 'text-slate-500 hover:bg-slate-800 border border-slate-700/50 bg-slate-900')} title="Rafraîchir">
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
        </button>
        {planLevel >= 1 && (
          <button onClick={onTest} disabled={testing} className={cn('flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition-all disabled:opacity-50', isLight ? 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200 bg-white' : 'text-emerald-400 hover:bg-emerald-500/10 border border-emerald-700/50 bg-slate-900')}>
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Tester
          </button>
        )}
        <button
          onClick={onGenerateToken} disabled={generating || tokenActive}
          className={cn('flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed', isLight ? 'text-blue-600 hover:bg-blue-50 border border-blue-200 bg-white' : 'text-blue-400 hover:bg-blue-500/10 border border-blue-700/50 bg-slate-900')}
          title={tokenActive ? 'Token déjà actif — révoquez-le pour en générer un nouveau' : 'Générer un token de sécurité'}
        >
          {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
          {tokenActive ? 'Token actif' : 'Générer token'}
        </button>
        <button onClick={onEdit} className={cn('flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition-all', isLight ? 'text-amber-600 hover:bg-amber-50 border border-amber-200 bg-white' : 'text-amber-400 hover:bg-amber-500/10 border border-amber-700/50 bg-slate-900')}>
          <Pencil className="w-3.5 h-3.5" />
          Modifier
        </button>
        <button onClick={onDelete} disabled={deleting} className={cn('flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition-all disabled:opacity-50', isLight ? 'text-red-500 hover:bg-red-50 border border-red-200 bg-white' : 'text-red-400 hover:bg-red-500/10 border border-red-700/50 bg-slate-900')}>
          <Trash2 className="w-3.5 h-3.5" />
          Supprimer
        </button>
      </div>
    </div>
  )
}
