import { motion } from 'framer-motion'
import { Wifi, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * HotspotGrid — Grille de sélection d'un hotspot (quand aucun n'est sélectionné)
 *
 * Props :
 *  - hotspots  : array (requis)
 *  - isLight   : boolean (requis)
 *  - onSelect  : fn(hotspotId) (requis)
 *  - cardCls   : string (requis)
 */
export default function HotspotGrid({ hotspots, isLight, onSelect, cardCls }) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('rounded-2xl p-6 relative overflow-hidden', cardCls)}
    >
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/2 rounded-full blur-[80px] pointer-events-none" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 relative">
        {hotspots.map((hs) => {
          const hid = hs.hotspot_id || hs.id
          const routerInfo = hs.router_type || hs.router_brand || ''
          return (
            <button
              key={hid}
              onClick={() => onSelect(hid)}
              className={cn(
                'group flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
                isLight
                  ? 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md'
                  : 'bg-slate-800/30 border-slate-700/50 hover:border-blue-500/30 hover:bg-blue-500/5 hover:shadow-lg hover:shadow-blue-500/5',
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105',
                isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400',
              )}>
                <Wifi className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-semibold truncate', textPrimary)}>
                  {hs.name || 'Sans nom'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {hs.location && (
                    <span className={cn('text-[10px] truncate', textMuted)}>{hs.location}</span>
                  )}
                  {routerInfo && (
                    <span className={cn('text-[10px]', textMuted)}>· {routerInfo}</span>
                  )}
                </div>
              </div>
              <ChevronDown className={cn('w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all', textMuted)} />
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}
