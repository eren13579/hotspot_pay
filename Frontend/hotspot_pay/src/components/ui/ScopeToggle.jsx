import { Globe, User } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * ScopeToggle — Bascule Global / Moi pour admin
 *
 * Props :
 *  - scope     : 'global' | 'self'   (requis)
 *  - onChange   : fn(scope)           (requis)
 *  - isLight   : boolean              (requis)
 *  - size      : 'sm' | 'md'         (défaut: 'sm')
 *
 * Utilisation :
 *   <ScopeToggle scope={scope} onChange={setScope} isLight={isLight} />
 */
export default function ScopeToggle({ scope, onChange, isLight, size = 'sm' }) {
  const h = size === 'sm' ? 'h-7' : 'h-9'
  const px = size === 'sm' ? 'px-3' : 'px-4'
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs'

  return (
    <div className={cn(
      'flex items-center p-0.5 rounded-xl border h-fit',
      isLight ? 'border-slate-200 bg-white' : 'border-slate-700/50 bg-slate-900',
    )}>
      <button
        onClick={() => onChange('global')}
        className={cn(
          `flex items-center gap-1.5 ${h} ${px} rounded-lg ${textSize} font-semibold transition-all whitespace-nowrap`,
          scope === 'global'
            ? 'bg-blue-600 text-white shadow-sm'
            : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white',
        )}
      >
        <Globe className={iconSize} />
        Global
      </button>
      <button
        onClick={() => onChange('self')}
        className={cn(
          `flex items-center gap-1.5 ${h} ${px} rounded-lg ${textSize} font-semibold transition-all whitespace-nowrap`,
          scope === 'self'
            ? 'bg-blue-600 text-white shadow-sm'
            : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white',
        )}
      >
        <User className={iconSize} />
        Moi
      </button>
    </div>
  )
}
