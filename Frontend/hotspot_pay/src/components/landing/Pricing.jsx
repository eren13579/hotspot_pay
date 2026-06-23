import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Check, Loader2, Phone, Wallet, Crown, Wifi, Shield, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscriptionsApi } from '../../api/endpoints'
import { formatXAF } from '../../utils/format'

const PLAN_LABELS = { BASIC: 'Basic', PRO: 'Pro', PREMIUM: 'Premium' }

var buildFeatures = function(plan) {
  var a = plan.advantages || {}
  var h = a.maxHotspots || plan.maxHotspots || 1
  var p = a.plansPerHotspot || 5
  var t = (a.monthlyTickets || 100).toLocaleString('fr-FR')
  var f = []

  if (a.unlimitedHotspots) f.push('Hotspots illimites')
  else f.push(h + ' hotspot' + (h > 1 ? 's' : '') + ' maximum')

  if (a.unlimitedPlans) f.push('Forfaits illimites')
  else f.push(p + ' forfait' + (p > 1 ? 's' : '') + ' par hotspot')

  if (a.unlimitedTickets) f.push('Tickets illimites')
  else f.push(t + ' tickets / mois')

  f.push(a.exportCsv ? 'Export CSV' : 'Export CSV non disponible')

  if (a.apiAccess === 'full') f.push('API complete')
  else if (a.apiAccess === 'read') f.push('API (lecture seule)')
  else f.push('API non disponible')

  if (a.advancedStats) f.push('Statistiques temps reel')
  else f.push('Dashboard basique')

  if (a.prioritySupport) f.push('Support prioritaire 24/7')

  return f
}

function Pricing() {
  var navigate = useNavigate()
  var isAuthenticated = useSelector(function(s) { return s.auth.isAuthenticated })
  var userPlanType = useSelector(function(s) { return s.auth.user ? s.auth.user.planType || '' : '' })

  var [plans, setPlans] = useState([])
  var [loading, setLoading] = useState(true)
  var [error, setError] = useState(null)
  var [currentPlanId, setCurrentPlanId] = useState(null)
  var [isAnnual, setIsAnnual] = useState(false)
  var [selectedPlan, setSelectedPlan] = useState(null)
  var [phoneNumber, setPhoneNumber] = useState('')
  var [operator, setOperator] = useState('')
  var [subLoading, setSubLoading] = useState(false)
  var [subError, setSubError] = useState(null)
  var [subResponse, setSubResponse] = useState(null)

  var popularIndex = plans.length > 0 ? Math.floor(plans.length / 2) : -1

  const fetchPlans = async function() {
    try {
      setLoading(true); setError(null)
      var res = await subscriptionsApi.plans()
      if (res.data.success) setPlans(res.data.data || [])
      else setError(res.data.message || 'Erreur de chargement des plans')
    } catch (err) {
      setError(err.response ? err.response.data.message : 'Impossible de charger les plans')
    } finally { setLoading(false) }
  }

  useEffect(function() { fetchPlans() }, [])

  useEffect(function() {
    if (!isAuthenticated) return
    var cancelled = false
    var fn = async function() {
      try {
        var res = await subscriptionsApi.mine()
        if (!cancelled && res.data.success && res.data.data) {
          setCurrentPlanId((res.data.data.planName || res.data.data.plan_id || '').toUpperCase())
        }
      } catch (e) {}
    }
    fn()
    return function() { cancelled = true }
  }, [isAuthenticated])

  const isCurrentPlan = function(plan) {
    if (!isAuthenticated) return false
    if (currentPlanId) return currentPlanId === plan.planName
    return userPlanType.toUpperCase() === plan.planName
  }

  const handleChoosePlan = function(plan) {
    if (!isAuthenticated) { navigate('/sign-in'); return }
    if (isCurrentPlan(plan)) return
    setSelectedPlan(plan); setPhoneNumber(''); setOperator(''); setSubError(null); setSubResponse(null)
  }

  const handleSubscribe = async function(e) {
    e.preventDefault()
    if (!operator) return
    setSubLoading(true); setSubError(null)
    try {
      var res = await subscriptionsApi.subscribe({
        plan_name: selectedPlan.planName, duration_months: isAnnual ? 12 : 1, currency: 'XAF',
      })
      if (res.data.success) {
        setSubResponse(res.data.data || { status: 'PENDING', message: 'Paiement initie. Verifiez votre telephone.' })
      } else { setSubError(res.data.message || 'Erreur lors de la souscription') }
    } catch (err) { setSubError(err.response ? err.response.data.message : 'Erreur reseau') }
    finally { setSubLoading(false) }
  }

  const closeModal = function() { setSelectedPlan(null); setSubResponse(null); setSubError(null) }

  const displayPrice = function(plan) {
    var monthly = Number(plan.monthlyPrice || 0)
    return isAnnual ? Number(plan.yearlyPrice || monthly * 12) : monthly
  }

  const planIcon = function(planName) {
    switch (planName) {
      case 'BASIC': return Wifi
      case 'PRO': return Shield
      case 'PREMIUM': return Crown
      default: return Sparkles
    }
  }

  const planColor = function(planName) {
    switch (planName) {
      case 'BASIC': return { bg: 'from-slate-500/10 to-transparent', border: 'border-slate-800', text: 'text-slate-300' }
      case 'PRO': return { bg: 'from-blue-500/10 to-transparent', border: 'border-blue-500/20', text: 'text-blue-400' }
      case 'PREMIUM': return { bg: 'from-blue-600/10 to-transparent', border: 'border-blue-500/20', text: 'text-blue-400' }
      default: return { bg: 'from-slate-500/10 to-transparent', border: 'border-slate-800', text: 'text-slate-300' }
    }
  }

  return (
    <section id="pricing" className="bg-slate-950 py-16 md:py-24 relative overflow-hidden select-none border-t border-slate-900/60">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-150 h-150 bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full px-4 md:px-8 lg:px-16 2xl:px-24 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 mb-10 md:mb-16">
          <div>
            <span className="text-blue-400 font-semibold text-xs tracking-widest uppercase bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 inline-block mb-4">
              Tarification
            </span>
            <h2 className="text-2xl md:text-5xl font-heading text-white tracking-tight mb-4">
              Des plans adaptés à{' '}
              <span className="bg-linear-to-r from-white to-blue-400 bg-clip-text text-transparent">
                votre croissance
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/40 border border-slate-900 p-1.5 rounded-2xl self-start md:self-end">
            <button
              onClick={function() { setIsAnnual(false) }}
              className={'px-4 py-2 rounded-xl text-xs font-bold transition-all ' + (!isAnnual ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white')}
            >
              Mensuel
            </button>
            <button
              onClick={function() { setIsAnnual(true) }}
              className={'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ' + (isAnnual ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white')}
            >
              Annuel{' '}
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                -15%
              </span>
            </button>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map(function(i) {
              return (
                <div key={i} className="rounded-3xl p-6 bg-slate-900/10 border border-slate-900/80 animate-pulse">
                  <div className="h-5 w-24 bg-slate-800 rounded mb-3" />
                  <div className="h-3 w-32 bg-slate-800 rounded mb-6" />
                  <div className="h-8 w-28 bg-slate-800 rounded mb-8" />
                  <div className="space-y-3 mb-8">{[1, 2, 3, 4].map(function(j) { return <div key={j} className="h-3 bg-slate-800 rounded" /> })}</div>
                  <div className="h-10 bg-slate-800 rounded-xl" />
                </div>
              )
            })}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <button onClick={fetchPlans}
              className="text-xs font-semibold text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl hover:bg-blue-500/10 transition-all cursor-pointer">
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && plans.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">Aucun plan disponible pour le moment.</p>
          </div>
        )}

        {!loading && !error && plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
            {plans.map(function(plan, index) {
              var isPopular = plan.isPopular || index === popularIndex
              var Icon = planIcon(plan.planName)
              var colors = planColor(plan.planName)
              var features = buildFeatures(plan)
              var monthly = Number(plan.monthlyPrice || 0)
              var yearly = Number(plan.yearlyPrice || monthly * 12)
              var yearlyDiscount = monthly > 0 ? Math.round((1 - yearly / (monthly * 12)) * 100) : 0

              return (
                <div key={plan.planName}
                  className={'relative rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col justify-between border transition-all bg-gradient-to-b ' + colors.bg + ' ' + (isPopular ? colors.border + ' shadow-xl ring-1 ring-blue-500/20' : 'border-slate-800/80')}>

                  {isPopular && (
                    <span className="absolute -top-3 right-6 text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-blue-600 text-white">
                      Populaire
                    </span>
                  )}

                  <div>
                    <div className="mb-4">
                      <div className={'w-10 h-10 rounded-xl flex items-center justify-center mb-3 ' + (plan.planName === 'BASIC' ? 'bg-slate-800 text-slate-400' : 'bg-blue-500/15 text-blue-400')}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-1">{PLAN_LABELS[plan.planName] || plan.planName}</h3>
                      {plan.description && <p className="text-slate-400 text-xs">{plan.description}</p>}
                    </div>

                    <div className="mb-8 min-h-16 flex flex-col justify-center">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white tracking-tight">
                          {monthly === 0 ? 'Gratuit' : Math.round(displayPrice(plan)).toLocaleString('fr-FR')}
                        </span>
                        {monthly > 0 && (
                          <><span className="text-xs font-bold text-slate-400">XAF</span><span className="text-slate-500 text-xs ml-1">/{isAnnual ? 'an' : 'mois'}</span></>
                        )}
                      </div>
                      {isAnnual && monthly > 0 && yearlyDiscount > 0 && (
                        <p className="text-[10px] text-emerald-400 mt-1 font-medium">Économisez {yearlyDiscount}%</p>
                      )}
                      {!isAnnual && monthly > 0 && yearlyDiscount > 0 && (
                        <p className="text-[10px] text-slate-500 mt-1">{formatXAF(yearly)}/an — Économisez {yearlyDiscount}%</p>
                      )}
                    </div>

                    <div className="w-full h-px bg-slate-800/60 mb-6" />

                    <ul className="space-y-3.5 mb-8">
                      {features.map(function(feature, idx) {
                        return (
                          <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                            <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5 stroke-3" />
                            </div>
                            <span>{feature}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  {isCurrentPlan(plan) ? (
                    <div className="w-full text-center font-bold text-xs py-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-1.5 select-none">
                      <Check className="w-3.5 h-3.5" /> Plan actuel
                    </div>
                  ) : (
                    <button onClick={function() { handleChoosePlan(plan) }}
                      className={'w-full text-center font-bold text-xs py-3.5 rounded-xl cursor-pointer transition-all ' + (isPopular ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-900')}>
                      {monthly === 0 ? 'Commencer gratuitement' : 'Choisir ce plan'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <AnimatePresence>
          {selectedPlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative z-10 text-white overflow-hidden shadow-2xl"
              >
                <h3 className="text-lg font-bold mb-1">Finalisez votre abonnement</h3>
                <p className="text-slate-400 text-xs mb-6">
                  Plan :{' '}
                  <span className="text-blue-400 font-bold uppercase">{PLAN_LABELS[selectedPlan.planName] || selectedPlan.planName}</span>{' '}
                  ({isAnnual ? 'Annuel' : 'Mensuel'})
                </p>

                {!subResponse ? (
                  <form onSubmit={handleSubscribe} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Opérateur Mobile Money</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={function() { setOperator('MTN_MOMO') }}
                          className={'p-4 rounded-xl border text-center font-bold text-sm transition-all flex flex-col items-center gap-2 cursor-pointer ' + (operator === 'MTN_MOMO' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-slate-950 border-slate-800 text-slate-400')}>
                          <Wallet className="w-5 h-5" /> MTN MoMo
                        </button>
                        <button type="button" onClick={function() { setOperator('ORANGE_MONEY') }}
                          className={'p-4 rounded-xl border text-center font-bold text-sm transition-all flex flex-col items-center gap-2 cursor-pointer ' + (operator === 'ORANGE_MONEY' ? 'bg-orange-500/10 border-orange-500 text-orange-400' : 'bg-slate-950 border-slate-800 text-slate-400')}>
                          <Wallet className="w-5 h-5" /> Orange Money
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Numéro de téléphone</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                        <input type="tel" required placeholder="6xx xxx xxx" value={phoneNumber}
                          onChange={function(e) { setPhoneNumber(e.target.value) }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all" />
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                      <span className="text-xs text-slate-400 font-medium">Montant à payer :</span>
                      <span className="font-black text-lg text-emerald-400">{Math.round(displayPrice(selectedPlan)).toLocaleString('fr-FR')} XAF</span>
                    </div>

                    {subError && <p className="text-xs text-red-400 text-center">{subError}</p>}

                    <button type="submit" disabled={subLoading || !operator}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-4 rounded-xl tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                      {subLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Initier le paiement'}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                    <h4 className="font-bold text-base">Paiement initialisé !</h4>
                    <p className="text-xs text-slate-400 px-4 leading-relaxed">
                      {subResponse.message || 'Veuillez valider le prompt de paiement sur votre téléphone.'}
                    </p>
                    {subResponse.subscriptionId && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-500">ID: {subResponse.subscriptionId}</div>
                    )}
                    <button onClick={closeModal}
                      className="mt-4 text-xs font-bold text-slate-400 hover:text-white underline block mx-auto cursor-pointer">
                      Fermer
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

export default Pricing
