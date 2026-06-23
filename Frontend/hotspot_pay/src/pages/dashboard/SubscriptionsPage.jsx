/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { CreditCard, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { subscriptionsApi, dashboardApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/cn'
import EmptyState, { ErrorState } from '../../components/ui/EmptyState'
import {
  TierCard,
  SubscriptionHero,
  UpgradeModal,
  FeatureComparison,
  HistoryTable,
  LoadingSkeleton,
  PLAN_LEVEL,
} from '../../components/subscriptions'
import { TIERS } from '../../components/subscriptions/constants'

/* ==========================================
   Fonction utilitaire : fusion API + template
   ========================================== */
function mergePlans(apiPlans) {
  const buildFeaturesFromAdv = (adv) => {
    if (!adv || typeof adv !== 'object') return null
    const features = []
    const push = (label, ok, highlight) => features.push({ label, ok, highlight })
    if (adv.unlimitedHotspots) push('Hotspots illimités', true, true)
    else push(`${adv.maxHotspots || 1} hotspot${(adv.maxHotspots || 1) > 1 ? 's' : ''}`, true, false)
    if (adv.unlimitedPlans) push('Forfaits illimités', true, false)
    else push(`${adv.plansPerHotspot || 5} forfait${(adv.plansPerHotspot || 5) > 1 ? 's' : ''} par hotspot`, true, false)
    if (adv.unlimitedTickets) push('Tickets illimités', true, true)
    else push(`${(adv.monthlyTickets || 100).toLocaleString('fr-FR')} tickets / mois`, true, false)
    push(adv.exportCsv ? 'Export CSV' : 'Export CSV', adv.exportCsv, false)
    if (adv.apiAccess === 'full') push('API complète', true, true)
    else if (adv.apiAccess === 'read') push('API (lecture seule)', true, false)
    else push('API', false, false)
    push(adv.advancedStats ? 'Statistiques temps réel' : 'Statistiques avancées', adv.advancedStats, adv.advancedStats)
    push('Support prioritaire', !!adv.prioritySupport, !!adv.prioritySupport)
    return features
  }

  return TIERS.map(tier => {
    const api = apiPlans.find(p => (p.planName || '').toUpperCase() === tier.key) || {}
    const monthly = Number(api.monthlyPrice ?? 0)
    const yearly = Number(api.yearlyPrice ?? monthly * 12)
    return {
      ...tier,
      advantages: api.advantages || null,
      _features: api.advantages ? buildFeaturesFromAdv(api.advantages, tier.key) : null,
      monthlyPrice: monthly,
      yearlyPrice: yearly,
      popular: !!api.isPopular,
      tagline: api.description || tier.label,
    }
  })
}

/* ==========================================
   Page principale
   ========================================== */
export default function SubscriptionsPage() {
  const theme = useSelector((state) => state.ui.theme)
  const { user, role } = useAuth()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const isLight = theme === 'light'

  const textPrimary   = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted     = isLight ? 'text-slate-400' : 'text-slate-500'

  // ── Données ────────────────────────────────────────────────────────────
  const [mySub, setMySub] = useState(null)
  const [history, setHistory] = useState([])
  const [plans, setPlans] = useState([])
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── Upgrade flow ───────────────────────────────────────────────────────
  const [step, setStep] = useState(0)
  const [targetPlan, setTargetPlan] = useState('')
  const [duration, setDuration] = useState(1)
  const [operator, setOperator] = useState('MTN_MOMO')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const currentPlanName = mySub?.planName || user?.planType || 'BASIC'
  const planLevel = PLAN_LEVEL[currentPlanName] ?? 0

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [plansRes, mineRes] = await Promise.all([
        subscriptionsApi.plans(),
        subscriptionsApi.mine(),
      ])
      setMySub(mineRes?.data?.data || null)

      try {
        const usageRes = await dashboardApi.counts(user?.id || user?.userId)
        const d = usageRes?.data?.data
        if (d) setUsage({
          hotspotCount: d.hotspotCount || d.hotspots || d.totalHotspots || 0,
          ticketCount: d.ticketCount || d.tickets || d.totalTickets || 0,
          planCount: d.planCount || d.plans || d.totalPlans || 0,
        })
      } catch { /* silencieux */ }

      const apiPlans = Array.isArray(plansRes?.data?.data) ? plansRes.data.data : []
      setPlans(mergePlans(apiPlans))

      try {
        const histRes = await subscriptionsApi.history()
        setHistory(Array.isArray(histRes?.data?.data) ? histRes.data.data : [])
      } catch { /* silencieux */ }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Upgrade handler ────────────────────────────────────────────────────
  const handleUpgrade = async () => {
    if (!phone) { toast.error('Numéro de téléphone requis'); return }
    setSubmitting(true)
    try {
      const payload = { planName: targetPlan, durationMonths: duration, operator, phone }
      const { data } = await subscriptionsApi.subscribe(payload)
      if (data?.success) {
        toast.success('Abonnement mis à jour avec succès')
        setStep(0); setPhone('')
        fetchData()
      } else {
        toast.error(data?.message || 'Erreur lors de la souscription')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  const startUpgrade = (planKey) => { setTargetPlan(planKey); setStep(1) }
  const closeUpgrade = () => { setStep(0); setPhone('') }

  // ═════════════════════════════════════════════════════════════════════
  // RENDU
  // ═════════════════════════════════════════════════════════════════════

  if (loading) return <LoadingSkeleton isLight={isLight} />

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center',
            isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400',
          )}>
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className={cn('text-xl font-black tracking-tight', textPrimary)}>Abonnement</h1>
            <p className={cn('text-[11px]', textSecondary)}>
              {mySub ? `Plan ${plans.find(t => t.key === currentPlanName)?.label || currentPlanName}` : 'Aucun abonnement actif'}
            </p>
          </div>
        </div>
        <button onClick={fetchData}
          aria-label="Rafraîchir"
          className={cn(
            'flex items-center justify-center w-9 h-9 rounded-xl transition-colors cursor-pointer',
            isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800',
          )}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Erreur ── */}
      {error && <ErrorState error={error} onRetry={fetchData} isLight={isLight} />}

      {!error && (
        <>
          {/* ── Carte d'abonnement actuel ── */}
          <SubscriptionHero
            mySub={mySub}
            plans={plans}
            currentPlanName={currentPlanName}
            usage={usage}
            planLevel={planLevel}
            isAdmin={isAdmin}
            isLight={isLight}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            textMuted={textMuted}
            onUpgrade={startUpgrade}
          />

          {/* ── Comparaison des plans ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn('text-sm font-bold', textPrimary)}>Choisissez votre plan</h2>
              <span className={cn('text-[10px]', textMuted)}>Paiement mobile (Mobile Money)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((tier) => {
                const tierLevel = PLAN_LEVEL[tier.key] ?? 0
                const isCurrent = currentPlanName === tier.key
                const isUpgrade = !isCurrent && tierLevel > planLevel && !isAdmin
                return (
                  <TierCard
                    key={tier.key}
                    tier={tier}
                    isCurrent={isCurrent}
                    isUpgrade={isUpgrade}
                    planLevel={planLevel}
                    isLight={isLight}
                    onSelect={startUpgrade}
                    textPrimary={textPrimary}
                    textSecondary={textSecondary}
                    textMuted={textMuted}
                  />
                )
              })}
            </div>
          </div>

          {/* ── Comparaison détaillée ── */}
          <FeatureComparison
            plans={plans}
            currentPlanName={currentPlanName}
            isLight={isLight}
            textPrimary={textPrimary}
            textMuted={textMuted}
          />

          {/* ── Historique ── */}
          <HistoryTable
            history={history}
            isLight={isLight}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            textMuted={textMuted}
          />

          {/* ── Empty state ── */}
          {!mySub && (
            <EmptyState
              icon={CreditCard}
              title="Aucun abonnement"
              message="Sélectionnez un plan ci-dessus pour commencer."
              isLight={isLight}
            />
          )}
        </>
      )}

      {/* ── Modale d'upgrade 3 étapes ── */}
      <UpgradeModal
        open={step > 0}
        step={step}
        setStep={setStep}
        onClose={closeUpgrade}
        targetPlan={targetPlan}
        plans={plans}
        duration={duration}
        setDuration={setDuration}
        operator={operator}
        setOperator={setOperator}
        phone={phone}
        setPhone={setPhone}
        submitting={submitting}
        onSubmit={handleUpgrade}
        isLight={isLight}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        textMuted={textMuted}
      />
    </div>
  )
}
