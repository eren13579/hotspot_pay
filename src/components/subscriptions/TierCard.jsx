import { Check, X, ChevronRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { formatXAF } from '../../utils/format'

const colorMap = (tier, isLight) => ({
  slate:  isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700',
  blue:   isLight ? 'bg-blue-50 text-blue-600 border-blue-200'     : 'bg-blue-500/10 text-blue-400 border-blue-700',
  amber:  isLight ? 'bg-amber-50 text-amber-600 border-amber-200'  : 'bg-amber-500/10 text-amber-400 border-amber-700',
}[tier.color] || 'bg-slate-100 text-slate-600 border-slate-200')

export default function TierCard({ tier, isCurrent, isUpgrade, isLight, onSelect, textPrimary, textSecondary, textMuted }) {
  const Icon = tier.icon
  const containerCls = isLight ? 'bg-white' : 'bg-slate-900/50'

  const borderAccent = isCurrent
    ? (tier.color === 'blue' ? 'border-blue-500 ring-1 ring-blue-500/30'
        : tier.color === 'amber' ? 'border-amber-500 ring-1 ring-amber-500/30'
        : isLight ? 'border-slate-300' : 'border-slate-600')
    : ''

  const showYearly = tier.monthlyPrice > 0
  const yearlyDiscount = tier.monthlyPrice > 0
    ? Math.round((1 - tier.yearlyPrice / (tier.monthlyPrice * 12)) * 100)
    : 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative rounded-2xl border overflow-hidden transition-all duration-300',
        containerCls,
        borderAccent,
        isUpgrade && !isCurrent && 'hover:scale-[1.02] hover:shadow-lg',
      )}
      role="article"
      aria-label={`Plan ${tier.label}`}
    >
      {/* Popular badge */}
      {tier.popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
          <div className="px-4 py-1 rounded-b-lg bg-linear-to-r from-blue-600 to-blue-500 text-white text-[10px] font-bold tracking-wider flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3 h-3" />
            POPULAIRE
          </div>
        </div>
      )}

      {/* Header */}
      <div className={cn('p-5 pb-0', tier.popular && 'pt-8')}>
        <div className="flex items-center justify-between mb-1">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border-2', colorMap(tier, isLight))}>
            <Icon className="w-5 h-5" />
          </div>
          {isCurrent && (
            <span className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border',
              tier.color === 'blue'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                : tier.color === 'amber'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
            )}>
              <Check className="w-2.5 h-2.5" />
              Actuel
            </span>
          )}
        </div>

        <h3 className={cn('text-lg font-bold mt-3', textPrimary)}>{tier.label}</h3>
        <p className={cn('text-[11px] mt-0.5', textSecondary)}>{tier.tagline}</p>

        {/* Prix */}
        <div className="mt-4">
          <div className="flex items-baseline gap-0.5">
            <span className={cn(
              'text-3xl font-black tracking-tight',
              tier.monthlyPrice === 0 ? textSecondary : textPrimary,
            )}>
              {tier.monthlyPrice === 0 ? 'Gratuit' : formatXAF(tier.monthlyPrice)}
            </span>
            {tier.monthlyPrice > 0 && (
              <span className={cn('text-[11px] font-medium', textMuted)}>/mois</span>
            )}
          </div>
          {showYearly && (
            <div className={cn('flex items-center gap-2 mt-1', textSecondary)}>
              <span className="text-[11px]">{formatXAF(tier.yearlyPrice)} / an</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400">
                -{yearlyDiscount}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Fonctionnalités */}
      <div className="px-5 py-4">
        <ul className="space-y-2.5">
          {(tier._features || tier.features).map((f, i) => (
            <li key={i} className="flex items-center gap-2.5 text-[11px]">
              <div className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center shrink-0',
                f.ok
                  ? (f.highlight ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/10 text-slate-400')
                  : 'bg-slate-800 text-slate-600',
              )}>
                {f.ok ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
              </div>
              <span className={cn(
                f.ok ? (f.highlight ? 'font-semibold' : '') : '',
                f.ok ? textPrimary : textMuted,
              )}>
                {f.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        {isCurrent ? (
          <div className={cn(
            'w-full py-2.5 rounded-xl text-[11px] font-bold text-center border',
            isLight ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-slate-800/50 text-slate-500 border-slate-700/50',
          )}>
            Plan actuel
          </div>
        ) : isUpgrade ? (
          <button
            onClick={() => onSelect(tier.key)}
            aria-label={`Passer à ${tier.label}`}
            className={cn(
              'w-full py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
              'bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.98]',
            )}
          >
            Passer à {tier.label}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className={cn(
            'w-full py-2.5 rounded-xl text-[11px] font-bold text-center',
            textMuted,
          )}>
            Plan supérieur
          </div>
        )}
      </div>
    </motion.div>
  )
}
