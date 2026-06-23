import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

/**
 * StatsCard — Carte de statistique avec icône, valeur et label
 *
 * Props :
 *  - stat     : { key, label, icon: Component, color: "from-X to-Y", bg: "bg-X/10", text: "text-X", fmt: fn|null }
 *  - value    : string (déjà formatée)
 *  - isLight  : boolean
 *  - delay    : number (animation stagger)
 */
export default function StatsCard({ stat, value, isLight, delay = 0 }) {
  const containerCls = isLight
    ? 'bg-white border border-slate-200'
    : 'bg-slate-900/50 border border-slate-800'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn('rounded-2xl p-4 relative overflow-hidden group', containerCls)}
    >
      <div className={cn('absolute inset-0 opacity-[0.03] bg-linear-to-br', stat.color)} />
      <div className="relative z-10">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-2.5', stat.bg)}>
          <stat.icon className={cn('w-4 h-4', stat.text)} />
        </div>
        <p className={cn('text-[10px] font-medium mb-0.5', textMuted)}>{stat.label}</p>
        <p className={cn('text-base font-black tracking-tight', textPrimary)}>{value}</p>
      </div>
    </motion.div>
  )
}

/**
 * StatsCardGrid — Grille de StatsCards avec animation stagger
 *
 * Props :
 *  - stats          : array de stat objects
 *  - overview       : object contenant les valeurs par clé
 *  - isLight        : boolean
 *  - periodLabel    : string | null
 *  - children       : ReactNode | null (cartes supplémentaires insérées à la fin)
 */
export function StatsCardGrid({ stats, overview, isLight, periodLabel, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      {stats.map((stat, i) => {
        const raw = overview?.[stat.key]
        const value = stat.fmt ? stat.fmt(raw) : raw?.toLocaleString('fr-FR') ?? '0'
        const label = stat.periodDynamic ? periodLabel : stat.label
        return <StatsCard key={stat.key} stat={{ ...stat, label }} value={value} isLight={isLight} delay={i * 0.05} />
      })}
      {children}
    </motion.div>
  )
}
