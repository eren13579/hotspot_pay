import { cn } from '../../../utils/cn'

/**
 * InfoRow — Ligne d'information avec icône, label et valeur
 *
 * Props :
 *  - icon       : composant lucide-react (requis)
 *  - label      : string (requis)
 *  - value      : string (requis)
 *  - isLight    : boolean (requis)
 */
export default function InfoRow({ icon: Icon, label, value, isLight }) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className="flex items-center gap-3">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', isLight ? 'bg-slate-100' : 'bg-slate-800')}>
        <Icon className={cn('w-4 h-4', isLight ? 'text-slate-500' : 'text-slate-400')} />
      </div>
      <div className="min-w-0">
        <p className={cn('text-[10px] font-medium', textMuted)}>{label}</p>
        <p className={cn('text-xs font-semibold truncate', textPrimary)}>{value}</p>
      </div>
    </div>
  )
}
