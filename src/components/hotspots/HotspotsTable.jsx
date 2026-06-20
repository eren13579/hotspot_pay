import { motion } from 'framer-motion'
import { Wifi, MapPin, Shield, Clock, X, Zap, RefreshCw, ExternalLink } from 'lucide-react'
import { cn } from '../../utils/cn'
import { timeAgo } from '../../utils/format'
import { HOTSPOT_STATUS_STYLE, HOTSPOT_STATUS_LABEL, HOTSPOT_STATUS_DOT } from '../ui/StatusBadge'
import Pagination from '../ui/Pagination'

/**
 * HotspotsTable — Tableau desktop des hotspots
 *
 * Props :
 *  - hotspots            : array (requis)
 *  - isLight             : boolean (requis)
 *  - selectedIds         : Set (requis)
 *  - onToggleSelect      : fn(id) (requis)
 *  - allFilteredSelected : boolean (requis)
 *  - onToggleSelectAll   : fn() (requis)
 *  - getHotspotId        : fn(hotspot) (requis)
 *  - onDetail            : fn(hotspot) (requis)
 *  - planLevel           : number
 *  - testingId           : string | null
 *  - onTest              : fn(id, event) (requis)
 *  - page                : number
 *  - totalPages          : number
 *  - onPageChange        : fn(page)
 */
export default function HotspotsTable({
  hotspots, isLight, selectedIds, onToggleSelect, allFilteredSelected, onToggleSelectAll,
  getHotspotId, onDetail, planLevel, testingId, onTest,
  page, totalPages, onPageChange,
}) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <caption className="sr-only">Liste des hotspots WiFi</caption>
        <thead>
          <tr className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={onToggleSelectAll}
                className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
              />
            </th>
            <th className={cn('text-left px-6 py-3 font-semibold', textMuted)}>Nom</th>
            <th className={cn('text-left px-6 py-3 font-semibold hidden sm:table-cell', textMuted)}>IP</th>
            <th className={cn('text-left px-6 py-3 font-semibold hidden md:table-cell', textMuted)}>Localisation</th>
            <th className={cn('text-left px-6 py-3 font-semibold hidden lg:table-cell', textMuted)}>Marque</th>
            <th className={cn('text-left px-6 py-3 font-semibold', textMuted)}>Statut</th>
            <th className={cn('text-left px-6 py-3 font-semibold hidden md:table-cell', textMuted)}>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Token</span>
            </th>
            <th className={cn('text-left px-6 py-3 font-semibold hidden xl:table-cell', textMuted)}>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Dernier ping</span>
            </th>
            <th className={cn('text-right px-6 py-3 font-semibold', textMuted)}>Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {hotspots.map((h, i) => {
            const hid = getHotspotId(h)
            const checked = selectedIds.has(hid)
            return (
              <motion.tr
                key={hid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'transition-colors cursor-pointer',
                  checked
                    ? isLight ? 'bg-blue-50/50' : 'bg-blue-500/5'
                    : isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/20',
                )}
                onClick={() => onDetail(h)}
              >
                <td className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleSelect(hid)}
                    onClick={(e) => e.stopPropagation()}
                    className="accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                  />
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isLight ? 'bg-blue-50' : 'bg-blue-500/10')}>
                      <Wifi className={cn('w-3.5 h-3.5', isLight ? 'text-blue-600' : 'text-blue-400')} />
                    </div>
                    <span className={cn('font-semibold', textPrimary)}>{h.name || 'Sans nom'}</span>
                  </div>
                </td>
                <td className={cn('px-6 py-3.5 hidden sm:table-cell font-mono', textSecondary)}>
                  {h.mikrotik_ip || '—'}
                </td>
                <td className={cn('px-6 py-3.5 hidden md:table-cell', textSecondary)}>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {h.location || '—'}
                  </span>
                </td>
                <td className={cn('px-6 py-3.5 hidden lg:table-cell', textSecondary)}>
                  {h.router_brand || '—'}
                </td>
                <td className="px-6 py-3.5">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-medium',
                    HOTSPOT_STATUS_STYLE[h.status] || HOTSPOT_STATUS_STYLE.NO_TOKEN,
                  )}>
                    {HOTSPOT_STATUS_DOT(h.status)}
                    {HOTSPOT_STATUS_LABEL[h.status] || h.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 hidden md:table-cell">
                  {h.router_token_configured ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                      <Shield className="w-3 h-3" />Configuré
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400">
                      <X className="w-3 h-3" />Aucun
                    </span>
                  )}
                </td>
                <td className={cn('px-6 py-3.5 hidden xl:table-cell', textSecondary)}>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 shrink-0" />
                    {h.last_ping_at ? timeAgo(h.last_ping_at) : 'Jamais'}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {planLevel >= 1 && (
                      <>
                        <button
                          onClick={(e) => onTest(hid, e)}
                          disabled={testingId === hid}
                          className={cn(
                            'flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50',
                            isLight ? 'text-emerald-600 hover:bg-emerald-50' : 'text-emerald-400 hover:bg-emerald-500/10',
                          )}
                        >
                          {testingId === hid ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">Tester</span>
                        </button>
                        <a
                          href={`${window.location.origin}/portal/${hid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all',
                            isLight ? 'text-purple-600 hover:bg-purple-50' : 'text-purple-400 hover:bg-purple-500/10',
                          )}
                          title="Voir le portail captif"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="hidden sm:inline">Portail</span>
                        </a>
                      </>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDetail(h) }}
                      className={cn(
                        'text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all',
                        isLight ? 'text-blue-600 hover:bg-blue-50' : 'text-blue-400 hover:bg-blue-500/10',
                      )}
                    >
                      Détails
                    </button>
                  </div>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={onPageChange} isLight={isLight} />
      )}
    </div>
  )
}
