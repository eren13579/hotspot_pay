import { cn } from '../../../utils/cn'

/**
 * StatCard — Carte de statistique avec icône
 *
 * Props :
 *  - icon     : composant lucide-react (requis)
 *  - label    : string (requis)
 *  - value    : string (requis)
 *  - color    : string (requis) — classe de couleur du texte (ex: 'text-emerald-400')
 *  - bg       : string (requis) — classe de fond (ex: 'bg-emerald-500/10')
 *  - isLight  : boolean (requis)
 */
export default function StatCard({ icon: Icon, label, value, color, bg, isLight }) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className={cn('flex items-center justify-between p-4 rounded-xl', isLight ? 'bg-slate-50' : 'bg-slate-800/30')}>
      <div className="flex items-center gap-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <div>
          <p className={cn('text-[10px] font-medium', textMuted)}>{label}</p>
          <p className={cn('text-sm font-bold', textPrimary)}>{value}</p>
        </div>
      </div>
    </div>
  )
}
