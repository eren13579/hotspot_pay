import { Wifi, BarChart3 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function UsageBars({ usage, currentPlanAdv, plans, currentPlanName, isLight, textPrimary, textSecondary }) {
  if (!usage) return null

  const maxHotspots = currentPlanAdv.maxHotspots || currentPlanAdv.unlimitedHotspots ? 999 : plans.find(x => x.key === currentPlanName)?.maxHotspots || 999
  const maxTickets = currentPlanAdv.monthlyTickets || 99999
  const hotspotPct = Math.min(100, Math.round((usage.hotspotCount / maxHotspots) * 100))
  const ticketPct = Math.min(100, Math.round((usage.ticketCount / maxTickets) * 100))

  return (
    <div className={cn('mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-3',
      isLight ? 'border-blue-200' : 'border-blue-500/15')}>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className={cn('text-[10px] font-medium', textSecondary)}>
            <Wifi className="inline w-3 h-3 mr-1 align-middle" />
            Hotspots
          </span>
          <span className={cn('text-[10px] font-bold', textPrimary)}>
            {usage.hotspotCount}{currentPlanAdv.unlimitedHotspots ? '+' : ''} / {currentPlanAdv.unlimitedHotspots ? '∞' : maxHotspots}
          </span>
        </div>
        <div className={cn('h-2 rounded-full overflow-hidden', isLight ? 'bg-slate-200' : 'bg-slate-800')}>
          <div className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            hotspotPct > 80 ? 'bg-red-500' : hotspotPct > 50 ? 'bg-yellow-500' : 'bg-blue-500',
          )} style={{ width: `${Math.min(100, hotspotPct)}%` }} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className={cn('text-[10px] font-medium', textSecondary)}>
            <BarChart3 className="inline w-3 h-3 mr-1 align-middle" />
            Tickets / mois
          </span>
          <span className={cn('text-[10px] font-bold', textPrimary)}>
            {usage.ticketCount}{currentPlanAdv.unlimitedTickets ? '+' : ''} / {currentPlanAdv.unlimitedTickets ? '∞' : maxTickets.toLocaleString('fr-FR')}
          </span>
        </div>
        <div className={cn('h-2 rounded-full overflow-hidden', isLight ? 'bg-slate-200' : 'bg-slate-800')}>
          <div className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            ticketPct > 80 ? 'bg-red-500' : ticketPct > 50 ? 'bg-yellow-500' : 'bg-emerald-500',
          )} style={{ width: `${Math.min(100, ticketPct)}%` }} />
        </div>
      </div>
    </div>
  )
}
