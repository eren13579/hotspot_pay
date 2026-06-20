/* eslint-disable no-unused-vars */
import { TrendingUp, ArrowRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatXAF } from '../../utils/format'

/**
 * TopHotspotsList — Classement des hotspots par revenu
 */
export default function TopHotspotsList({ hotspots, isLight, containerCls }) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  if (!hotspots || hotspots.length === 0) return null

  return (
    <div className={cn('rounded-2xl p-6', containerCls)}>
      <h3 className={cn('text-sm font-bold mb-4', textPrimary)}>Top hotspots</h3>
      {hotspots.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className={cn('text-xs', textMuted)}>Aucune donnée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {hotspots.map((hs, idx) => (
            <div
              key={hs.hotspotId || idx}
              className={cn('flex items-center justify-between p-3 rounded-xl', isLight ? 'bg-slate-50' : 'bg-slate-800/30')}
            >
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
                  idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                  idx === 1 ? 'bg-slate-500/20 text-slate-300' :
                  'bg-orange-500/20 text-orange-400',
                )}>
                  {idx + 1}
                </div>
                <div>
                  <p className={cn('text-xs font-semibold', textPrimary)}>{hs.name}</p>
                </div>
              </div>
              <span className={cn('text-xs font-bold', textPrimary)}>{formatXAF(hs.revenue)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * UpgradeCTA — Bannière d'invitation à passer à Pro
 */
export function UpgradeCTA({ onNavigate, isLight, containerCls }) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'

  return (
    <div className={cn('rounded-2xl p-6 text-center', containerCls)}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-amber-500/10">
        <TrendingUp className="w-6 h-6 text-amber-400" />
      </div>
      <h3 className={cn('text-sm font-bold mb-1', textPrimary)}>Passez à Pro</h3>
      <p className={cn('text-xs mb-4 max-w-xs mx-auto', textSecondary)}>
        Débloquez la répartition des tickets, le classement des hotspots et l'historique avancé.
      </p>
      <button
        onClick={onNavigate}
        className="inline-flex items-center gap-1.5 h-9 px-5 rounded-xl bg-linear-to-r from-amber-600 to-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
      >
        Voir les offres
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
