import { useMemo } from 'react'
import { useSelector } from 'react-redux'

const PLAN_FEATURES = {
  STANDARD: {
    level: 0,
    label: 'Standard',
    color: 'text-slate-400',
    badge: 'bg-slate-500/10 text-slate-400',
    showTicketDonut: false,
    showTopHotspots: false,
    showPlansKpi: false,
    maxChartDays: 7,
    allowedPeriods: ['today', '7d'],
    showExport: false,
  },
  PRO: {
    level: 1,
    label: 'Pro',
    color: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-400',
    showTicketDonut: true,
    showTopHotspots: true,
    showPlansKpi: true,
    maxChartDays: 30,
    allowedPeriods: ['today', '7d', '30d', '90d'],
    showExport: true,
  },
  PREMIUM: {
    level: 2,
    label: 'Premium',
    color: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-400',
    showTicketDonut: true,
    showTopHotspots: true,
    showPlansKpi: true,
    maxChartDays: 365,
    allowedPeriods: ['today', '7d', '30d', '90d', 'year', 'custom'],
    showExport: true,
  },
}

const PLAN_ORDER = ['STANDARD', 'PRO', 'PREMIUM']

export function usePlan() {
  const user = useSelector((state) => state.auth.user)
  const role = useSelector((state) => state.auth.role)

  return useMemo(() => {
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
    const rawPlan = user?.planType?.toUpperCase?.() || 'STANDARD'
    const planKey = PLAN_ORDER.includes(rawPlan) ? rawPlan : 'STANDARD'
    const features = PLAN_FEATURES[planKey]
    const isPremium = planKey === 'PREMIUM'
    const isProOrAbove = planKey === 'PRO' || planKey === 'PREMIUM'

    return {
      planKey,
      isAdmin,
      isPremium,
      isProOrAbove,
      features,
      // Les admins ont tout débloqué
      showTicketDonut: isAdmin || features.showTicketDonut,
      showTopHotspots: isAdmin || features.showTopHotspots,
      showPlansKpi: isAdmin || features.showPlansKpi,
      allowedPeriods: isAdmin ? ['today', '7d', '30d', '90d', 'year', 'custom'] : features.allowedPeriods,
      showExport: isAdmin || features.showExport,
      needsUpgrade: !isAdmin && planKey === 'STANDARD',
      upgradeLabel: planKey === 'STANDARD' ? 'Pro' : null,
    }
  }, [user, role])
}
