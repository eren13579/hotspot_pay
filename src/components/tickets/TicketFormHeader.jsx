import { cn } from '../../utils/cn'

/**
 * TicketFormHeader — En-têtes de colonnes pour le formulaire desktop
 *
 * Props :
 *  - textMuted : string
 */
export default function TicketFormHeader({ textMuted }) {
  return (
    <div className="hidden md:grid grid-cols-12 gap-3 px-1">
      <div className="col-span-1" />
      <span className={cn('col-span-2 text-[10px] font-semibold', textMuted)}>Username *</span>
      <span className={cn('col-span-2 text-[10px] font-semibold', textMuted)}>Mot de passe *</span>
      <span className={cn('col-span-2 text-[10px] font-semibold', textMuted)}>Profil</span>
      <span className={cn('col-span-2 text-[10px] font-semibold', textMuted)}>Durée max</span>
      <span className={cn('col-span-2 text-[10px] font-semibold', textMuted)}>Data max (MB)</span>
      <div className="col-span-1" />
    </div>
  )
}
