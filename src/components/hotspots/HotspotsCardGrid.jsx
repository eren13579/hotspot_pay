import { motion } from 'framer-motion'
import { Wifi, MapPin, Shield, Clock, RefreshCw, ExternalLink } from 'lucide-react'
import { cn } from '../../utils/cn'
import { timeAgo } from '../../utils/format'
import { HOTSPOT_STATUS_STYLE, HOTSPOT_STATUS_LABEL, HOTSPOT_STATUS_DOT } from '../ui/StatusBadge'
import Pagination from '../ui/Pagination'

/**
 * HotspotsCardGrid — Vue en cartes des hotspots
 *
 * Props : identiques à HotspotsTable
 */
export default function HotspotsCardGrid({
  hotspots, isLight, selectedIds, onToggleSelect,
  getHotspotId, onDetail, planLevel, testingId, onTest,
  page, totalPages, onPageChange,
}) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  const containerCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'

  return (
    <div className={cn('rounded-2xl overflow-hidden', containerCls)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
        {hotspots.map((h, i) => {
          const hid = getHotspotId(h)
          const checked = selectedIds.has(hid)
          return (
            <motion.div
              key={hid}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'rounded-xl p-4 border cursor-pointer transition-all',
                checked
                  ? isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/30'
                  : isLight ? 'bg-white border-slate-200 hover:border-slate-300' : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600',
              )}
              onClick={() => onDetail(h)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleSelect(hid)}
                    onClick={(e) => e.stopPropagation()}
                    className="accent-blue-600 w-3.5 h-3.5 cursor-pointer shrink-0 mt-0.5"
                  />
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', isLight ? 'bg-blue-50' : 'bg-blue-500/10')}>
                    <Wifi className={cn('w-4 h-4', isLight ? 'text-blue-600' : 'text-blue-400')} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn('text-sm font-semibold truncate', textPrimary)}>
                      {h.name || 'Sans nom'}
                    </p>
                    <span className={cn('text-[10px] font-mono', textMuted)}>
                      {h.mikrotik_ip || '—'}
                    </span>
                  </div>
                </div>
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-medium shrink-0',
                  HOTSPOT_STATUS_STYLE[h.status] || HOTSPOT_STATUS_STYLE.NO_TOKEN,
                )}>
                  {HOTSPOT_STATUS_DOT(h.status)}
                  {HOTSPOT_STATUS_LABEL[h.status] || h.status}
                </span>
              </div>

              <div className="space-y-1.5 mb-3 px-0.5">
                <div className="flex items-center gap-2 text-[11px]">
                  <MapPin className={cn('w-3 h-3 shrink-0', textMuted)} />
                  <span className={cn('truncate', textSecondary)}>{h.location || 'Non défini'}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Shield className={cn('w-3 h-3 shrink-0', textMuted)} />
                  {h.router_token_configured ? (
                    <span className="text-emerald-400 font-medium">Token configuré</span>
                  ) : (
                    <span className="text-amber-400 font-medium">Aucun token</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Clock className={cn('w-3 h-3 shrink-0', textMuted)} />
                  <span className={textSecondary}>{h.last_ping_at ? timeAgo(h.last_ping_at) : 'Jamais connecté'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {planLevel >= 1 && (
                  <button
                    onClick={(e) => onTest(hid, e)}
                    disabled={testingId === hid}
                    className={cn(
                      'flex-1 h-8 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50',
                      isLight
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
                    )}
                  >
                    {testingId === hid ? (
                      <RefreshCw className="w-3 h-3 animate-spin mx-auto" />
                    ) : 'Tester'}
                  </button>
                )}
                {planLevel >= 1 && (
                  <a
                    href={`${window.location.origin}/portal/${hid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      'flex-1 h-8 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1',
                      isLight
                        ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                        : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20',
                    )}
                    title="Voir le portail captif"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Portail
                  </a>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDetail(h) }}
                  className={cn(
                    'flex-1 h-8 rounded-lg text-[11px] font-semibold transition-all',
                    isLight
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
                  )}
                >
                  Détails
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} isLight={isLight} />
    </div>
  )
}
