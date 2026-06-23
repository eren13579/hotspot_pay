import { Wifi, Shield, Crown, Check, X, Timer, Info } from 'lucide-react'
import { Smartphone } from 'lucide-react'

export const PLAN_LEVEL = { BASIC: 0, PRO: 1, PREMIUM: 2 }

export const TIERS = [
  {
    key: 'BASIC',
    label: 'Basic',
    icon: Wifi,
    color: 'slate',
    features: [
      { ok: true, label: '1 hotspot', highlight: false },
      { ok: true, label: '5 forfaits par hotspot', highlight: false },
      { ok: true, label: '100 tickets / mois', highlight: false },
      { ok: false, label: 'Export CSV', highlight: false },
      { ok: false, label: 'API', highlight: false },
      { ok: false, label: 'Statistiques avancées', highlight: false },
      { ok: false, label: 'Support prioritaire', highlight: false },
    ],
  },
  {
    key: 'PRO',
    label: 'Pro',
    icon: Shield,
    color: 'blue',
    features: [
      { ok: true, label: '10 hotspots', highlight: false },
      { ok: true, label: 'Forfaits illimités', highlight: false },
      { ok: true, label: '10 000 tickets / mois', highlight: false },
      { ok: true, label: 'Export CSV', highlight: false },
      { ok: true, label: 'API (lecture)', highlight: false },
      { ok: true, label: 'Statistiques avancées', highlight: true },
      { ok: false, label: 'Support prioritaire', highlight: false },
    ],
  },
  {
    key: 'PREMIUM',
    label: 'Premium',
    icon: Crown,
    color: 'amber',
    features: [
      { ok: true, label: 'Hotspots illimités', highlight: true },
      { ok: true, label: 'Forfaits illimités', highlight: false },
      { ok: true, label: 'Tickets illimités', highlight: true },
      { ok: true, label: 'Export CSV', highlight: false },
      { ok: true, label: 'API complète', highlight: false },
      { ok: true, label: 'Statistiques temps réel', highlight: true },
      { ok: true, label: 'Support prioritaire 24/7', highlight: true },
    ],
  },
]

export const STATUS_STYLES = {
  ACTIVE:    { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400', icon: Check },
  PENDING:   { bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25',    dot: 'bg-yellow-400', icon: Timer },
  EXPIRED:   { bg: 'bg-red-500/10 text-red-400 border-red-500/25',            dot: 'bg-red-400',    icon: X },
  CANCELLED: { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/25',       dot: 'bg-slate-400',  icon: X },
  SUSPENDED: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',      dot: 'bg-amber-400',  icon: Info },
}

export const STATUS_LABEL = {
  ACTIVE: 'Actif', PENDING: 'En attente', EXPIRED: 'Expiré',
  CANCELLED: 'Annulé', SUSPENDED: 'Suspendu',
}

export const OPERATORS = [
  { value: 'MTN_MOMO',     label: 'MTN Mobile Money', icon: Smartphone },
  { value: 'ORANGE_MONEY', label: 'Orange Money',     icon: Smartphone },
  { value: 'CAMPAY',       label: 'CAMPAY',            icon: Smartphone },
  { value: 'MONEROO',      label: 'MONEROO',           icon: Smartphone },
]

export function getStatusInfo(status) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.CANCELLED
  return { ...s, label: STATUS_LABEL[status] || status }
}
