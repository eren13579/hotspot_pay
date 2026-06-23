import { Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * TicketFormRow — Ligne de formulaire pour un ticket (username, password, profil, durée, data)
 *
 * Props :
 *  - row         : { username, password, profile, timeLimit, dataLimit } (requis)
 *  - index       : number (requis)
 *  - isLight     : boolean (requis)
 *  - onUpdate    : fn(index, field, value) (requis)
 *  - onRemove    : fn(index) (requis)
 *  - canRemove   : boolean (requis)
 *  - inputBase   : string (requis)
 */
export default function TicketFormRow({ row, index, isLight, onUpdate, onRemove, canRemove, inputBase }) {
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const inputCls = inputBase?.replace('h-12', 'h-9')

  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-6 md:grid-cols-12 gap-2 p-3 rounded-xl items-start',
      isLight ? 'bg-slate-50 border border-slate-100' : 'bg-slate-800/20 border border-slate-800',
    )}>
      {/* Index */}
      <div className={cn(
        'hidden sm:flex col-span-1 items-center justify-center h-9 w-9 rounded-lg text-[10px] font-bold',
        isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-700/50 text-slate-400',
      )}>
        {index + 1}
      </div>

      {/* Username */}
      <div className="sm:col-span-2">
        <label className={cn('text-[10px] font-medium mb-1 block sm:hidden', textMuted)}>Username *</label>
        <input type="text" value={row.username}
          onChange={(e) => onUpdate(index, 'username', e.target.value)}
          placeholder="utilisateur"
          className={cn('w-full h-9 px-3 rounded-lg text-sm font-mono outline-none transition-all', inputCls)} />
      </div>

      {/* Password */}
      <div className="sm:col-span-2">
        <label className={cn('text-[10px] font-medium mb-1 block sm:hidden', textMuted)}>Mot de passe *</label>
        <input type="text" value={row.password}
          onChange={(e) => onUpdate(index, 'password', e.target.value)}
          placeholder="motdepasse"
          className={cn('w-full h-9 px-3 rounded-lg text-sm font-mono outline-none transition-all', inputCls)} />
      </div>

      {/* Profile */}
      <div className="sm:col-span-2">
        <label className={cn('text-[10px] font-medium mb-1 block sm:hidden', textMuted)}>Profil</label>
        <input type="text" value={row.profile}
          onChange={(e) => onUpdate(index, 'profile', e.target.value)}
          placeholder="default"
          className={cn('w-full h-9 px-3 rounded-lg text-sm outline-none transition-all', inputCls)} />
      </div>

      {/* Durée */}
      <div className="sm:col-span-2">
        <label className={cn('text-[10px] font-medium mb-1 block sm:hidden', textMuted)}>Durée max</label>
        <input type="text" value={row.timeLimit}
          onChange={(e) => onUpdate(index, 'timeLimit', e.target.value)}
          placeholder="ex: 1h, 30m"
          className={cn('w-full h-9 px-3 rounded-lg text-sm outline-none transition-all', inputCls)} />
      </div>

      {/* Data */}
      <div className="sm:col-span-2">
        <label className={cn('text-[10px] font-medium mb-1 block sm:hidden', textMuted)}>Data max (MB)</label>
        <input type="number" min="0" value={row.dataLimit}
          onChange={(e) => onUpdate(index, 'dataLimit', e.target.value)}
          placeholder="MB"
          className={cn('w-full h-9 px-3 rounded-lg text-sm outline-none transition-all', inputCls)} />
      </div>

      {/* Delete */}
      <div className="sm:col-span-1 flex justify-center">
        <button onClick={() => onRemove(index)} disabled={!canRemove}
          className={cn('h-9 w-9 rounded-lg flex items-center justify-center transition-all',
            !canRemove ? 'opacity-20 cursor-not-allowed' : isLight ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-red-500/60 hover:text-red-400 hover:bg-red-500/10',
          )}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
