import { cn } from '../../utils/cn'
import ConnectivityPulse from './ConnectivityPulse'

/**
 * Mappings statut → style + label pour hotspots
 */
export const HOTSPOT_STATUS_STYLE = {
  ONLINE:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  OFFLINE:  'text-red-400 bg-red-500/10 border-red-500/20',
  NEVER:    'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  NO_TOKEN: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
}

export const HOTSPOT_STATUS_LABEL = {
  ONLINE:   'En ligne',
  OFFLINE:  'Hors ligne',
  NEVER:    'Jamais connecté',
  NO_TOKEN: 'Non configuré',
}

export const HOTSPOT_STATUS_DOT = (status) => {
  if (status === 'ONLINE') return <ConnectivityPulse active size="sm" />
  if (status === 'OFFLINE') return <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
  if (status === 'NEVER') return <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
  return <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
}

/**
 * Mappings statut → style + label pour tickets
 */
export const TICKET_STATUS_STYLE = {
  AVAILABLE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  USED:      'text-blue-400 bg-blue-500/10 border-blue-500/20',
  EXPIRED:   'text-slate-500 bg-slate-500/10 border-slate-500/20',
  REVOKED:   'text-red-400 bg-red-500/10 border-red-500/20',
}

export const TICKET_STATUS_LABEL = {
  AVAILABLE: 'Disponible',
  USED:      'Utilisé',
  EXPIRED:   'Expiré',
  REVOKED:   'Révoqué',
}

/**
 * StatusBadge — Badge coloré avec dot
 *
 * Props :
 *  - status      : string (clé dans styleMap)
 *  - styleMap    : object { statusKey: className }
 *  - labelMap    : object { statusKey: string }
 *  - dotMap      : fn(status) → ReactNode | null
 *  - className   : string | null
 */
export default function StatusBadge({ status, styleMap, labelMap, dotMap, className }) {
  const cls = (styleMap && styleMap[status]) || ''
  const label = (labelMap && labelMap[status]) || status

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-medium',
      cls,
      className,
    )}>
      {dotMap && dotMap(status)}
      {label}
    </span>
  )
}

/**
 * Badge simple sans dot (pour tickets)
 */
export function TicketStatusBadge({ status, className }) {
  return (
    <StatusBadge
      status={status}
      styleMap={TICKET_STATUS_STYLE}
      labelMap={TICKET_STATUS_LABEL}
      className={className}
    />
  )
}

/**
 * Badge hotspot avec dot animé
 */
export function HotspotStatusBadge({ status, className }) {
  return (
    <StatusBadge
      status={status}
      styleMap={HOTSPOT_STATUS_STYLE}
      labelMap={HOTSPOT_STATUS_LABEL}
      dotMap={HOTSPOT_STATUS_DOT}
      className={className}
    />
  )
}

/**
 * Mappings statut → style + label pour sessions WiFi
 */
export const SESSION_STATUS_STYLE = {
  ACTIVE:          'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  PENDING_MIKROTIK: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  EXPIRED:         'text-slate-500 bg-slate-500/10 border-slate-500/20',
  REVOKED:         'text-red-400 bg-red-500/10 border-red-500/20',
}

export const SESSION_STATUS_LABEL = {
  ACTIVE:           'Active',
  PENDING_MIKROTIK: 'En attente',
  EXPIRED:          'Expirée',
  REVOKED:          'Révoquée',
}

export function SessionStatusBadge({ status, className }) {
  return (
    <StatusBadge
      status={status}
      styleMap={SESSION_STATUS_STYLE}
      labelMap={SESSION_STATUS_LABEL}
      className={className}
    />
  )
}
