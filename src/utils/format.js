/**
 * Formate un montant en XAF
 */
export function formatXAF(amount) {
  if (amount == null || isNaN(amount)) return '0 XAF'
  return `${Number(amount).toLocaleString('fr-FR')} XAF`
}

/**
 * Formate une date ISO en format français lisible
 */
export function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formate une date ISO en format court (dd/mm/yyyy)
 */
export function formatDateShort(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formate une date ISO en heure lisible
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Retourne le texte relatif (ex: "il y a 5 min")
 */
export function timeAgo(isoString) {
  if (!isoString) return ''
  const now = new Date()
  const past = new Date(isoString)
  const diffMs = now - past
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 30) return `il y a ${diffD}j`
  return formatDateShort(isoString)
}

/**
 * Statut avec traduction et couleur Tailwind
 */
export const STATUS_LABELS = {
  ACTIVE: { label: 'Actif', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  INACTIVE: { label: 'Inactif', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  PENDING: { label: 'En attente', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  SUCCESS: { label: 'Succès', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  FAILED: { label: 'Échec', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  EXPIRED: { label: 'Expiré', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
  REVOKED: { label: 'Révoqué', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  AVAILABLE: { label: 'Disponible', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  USED: { label: 'Utilisé', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  NO_TOKEN: { label: 'Non configuré', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  ONLINE: { label: 'En ligne', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  OFFLINE: { label: 'Hors ligne', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

export function getStatusInfo(status) {
  return STATUS_LABELS[status] || { label: status, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' }
}
