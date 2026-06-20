import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, Ticket, Smartphone, Shield, CheckCircle, AlertTriangle, RefreshCw, Clock, ArrowLeft, Globe, Zap, Copy, Check, Key, Eye, EyeOff } from 'lucide-react'
import { portalApi } from '../../api/endpoints'
import WifiSignalAnimation from '../../components/portal/WifiSignalAnimation'

/* ── Types ──────────────────────────────────────────────────────────── */
const STATUS = {
  LOADING:    'loading',
  ERROR:      'error',
  IDLE:       'idle',
  PAYING:     'paying',      // paiement initié, en attente
  CONNECTING: 'connecting',  // activation WiFi en cours
  CONNECTED:  'connected',   // ✅ succès
  FAILED:     'failed',      // ❌ échec
}

// Seuls les opérateurs Mobile Money — le backend route via Moneroo ou CamPay (agrégateur actif)
const OPERATORS = [
  { id: 'MTN_MOMO',      label: 'MTN MoMo',      color: 'from-yellow-500 to-yellow-600' },
  { id: 'ORANGE_MONEY',  label: 'Orange Money',  color: 'from-orange-500 to-orange-600' },
]

/* ── localStorage credentials ──────────────────────────────────────── */
const CREDENTIALS_KEY = 'hotspot_last_credentials'

function saveCredentials(data) {
  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({
      ...data,
      savedAt: new Date().toISOString(),
    }))
  } catch { /* silencieux */ }
}

function getSavedCredentials() {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return ''
  if (minutes < 60) return `${minutes} min`
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
  return `${Math.floor(minutes / 1440)}j`
}

function formatPrice(price, currency = 'XAF') {
  try {
    const n = Number(price)
    if (isNaN(n)) return `${price} ${currency}`
    return `${n.toLocaleString()} ${currency}`
  } catch { return `${price} ${currency}` }
}

function formatDataLimit(mb) {
  if (!mb && mb !== 0) return 'Illimité'
  return mb < 1024 ? `${mb} MB` : `${(mb / 1024).toFixed(1)} GB`
}

/* ── Subcomponents ───────────────────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <WifiSignalAnimation status="processing" size={100} />
      <p className="text-[#6B6258] text-sm animate-pulse">Chargement du portail...</p>
    </div>
  )
}

function ErrorDisplay({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-5 py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>
      <div>
        <h2 className="text-[#F5F0EB] text-lg font-semibold mb-1">Portail indisponible</h2>
        <p className="text-[#6B6258] text-sm max-w-xs mx-auto">{message || "Impossible de charger le portail. Vérifiez votre connexion."}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] text-[#0C0A08] font-semibold text-sm hover:bg-[#D4880A] transition-colors active:scale-[0.97]">
          <RefreshCw className="w-4 h-4" /> Réessayer
        </button>
      )}
    </motion.div>
  )
}

function SuccessScreen({ session, hotspotName, credentials }) {
  const [countdown, setCountdown] = useState(10)
  const [copiedField, setCopiedField] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const copyField = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(label)
      setTimeout(() => setCopiedField(null), 2000)
    } catch { /* ignore */ }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center gap-5 py-8 px-6 text-center"
    >
      <WifiSignalAnimation status="connected" size={120} />

      <div>
        <h2 className="text-[#F5F0EB] text-xl font-bold mb-1">✅ Connecté !</h2>
        <p className="text-[#6B6258] text-sm">
          {hotspotName ? `WiFi ${hotspotName}` : 'Vous êtes connecté au WiFi'}
        </p>
      </div>

      {/* ── Credentials ── */}
      {credentials && (
        <div className="w-full max-w-xs space-y-2">
          {/* Username */}
          {credentials.username && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1713] border border-[#2A231D]">
              <div className="text-left min-w-0 flex-1">
                <span className="text-[#6B6258] text-[10px] block">Identifiant</span>
                <span className="text-[#F5F0EB] text-sm font-mono truncate block">{credentials.username}</span>
              </div>
              <button onClick={() => copyField('user', credentials.username)}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6258] hover:text-[#F5F0EB] hover:bg-white/5 transition-all">
                {copiedField === 'user' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
          {/* Password */}
          {credentials.password && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1713] border border-[#2A231D]">
              <div className="text-left min-w-0 flex-1">
                <span className="text-[#6B6258] text-[10px] block">Mot de passe</span>
                <span className="text-[#F5F0EB] text-sm font-mono truncate block">
                  {showPassword ? credentials.password : '••••••••'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowPassword(v => !v)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6258] hover:text-[#F5F0EB] hover:bg-white/5 transition-all">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => copyField('pass', credentials.password)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6258] hover:text-[#F5F0EB] hover:bg-white/5 transition-all">
                  {copiedField === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
          {/* Référence paiement */}
          {credentials.reference && !credentials.username && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1713] border border-[#2A231D]">
              <div className="text-left min-w-0 flex-1">
                <span className="text-[#6B6258] text-[10px] block">Référence</span>
                <span className="text-[#F5F0EB] text-sm font-mono truncate block">{credentials.reference}</span>
              </div>
              <button onClick={() => copyField('ref', credentials.reference)}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6258] hover:text-[#F5F0EB] hover:bg-white/5 transition-all">
                {copiedField === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
          {/* Téléphone */}
          {credentials.phone && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1713] border border-[#2A231D]">
              <div className="text-left min-w-0 flex-1">
                <span className="text-[#6B6258] text-[10px] block">Mobile Money</span>
                <span className="text-[#F5F0EB] text-sm block">{credentials.phone}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Session info ── */}
      {session && (
        <div className="w-full max-w-xs space-y-2">
          {session.durationLabel && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#1C1713] border border-[#2A231D]">
              <span className="text-[#6B6258] text-xs flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Durée</span>
              <span className="text-[#F5F0EB] text-sm font-medium">{session.durationLabel}</span>
            </div>
          )}
          {session.expiresAt && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#1C1713] border border-[#2A231D]">
              <span className="text-[#6B6258] text-xs flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Expire</span>
              <span className="text-[#F5F0EB] text-sm font-medium">{new Date(session.expiresAt).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}

      {countdown > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-xs font-medium">Redirection dans {countdown}s</span>
        </div>
      )}

      <p className="text-[#6B6258] text-[11px]">Vous pouvez fermer cette page et naviguer librement</p>
    </motion.div>
  )
}

/* ── Main Component ──────────────────────────────────────────────────── */

export default function PortalPage() {
  const { hotspotId } = useParams()
  const [searchParams] = useSearchParams()
  const mac = searchParams.get('mac')

  const [status, setStatus] = useState(STATUS.LOADING)
  const [hotspot, setHotspot] = useState(null)
  const [plans, setPlans] = useState([])
  const [error, setError] = useState('')

  // Formulaire
  const [tab, setTab] = useState('pay')             // 'ticket' | 'pay'
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [phone, setPhone] = useState('')
  const [operator, setOperator] = useState(null)
  const [ticketUser, setTicketUser] = useState('')
  const [ticketPass, setTicketPass] = useState('')
  const [sessionData, setSessionData] = useState(null)

  // Paiement polling
  const pollingRef = useRef(null)
  const [paymentRef, setPaymentRef] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  // Credentials sauvegardés
  const [activeCredentials, setActiveCredentials] = useState(null)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const savedCredentials = getSavedCredentials()

  // ── Chargement initial ──────────────────────────────────────────────

  // Met à jour le titre de la page
  useEffect(() => {
    document.title = hotspot?.hotspotName
      ? `Portail WiFi — ${hotspot.hotspotName}`
      : 'Portail WiFi — HotspotPay'
  }, [hotspot])

  const loadPortal = useCallback(async () => {
    setStatus(STATUS.LOADING)
    setError('')
    try {
      const { data } = await portalApi.page(hotspotId, mac)
      if (data?.success && data?.data) {
        setHotspot(data.data)
        setPlans(data.data.plans || [])
        setStatus(STATUS.IDLE)
      } else {
        throw new Error(data?.message || 'Réponse invalide')
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Erreur de chargement'
      setError(msg)
      setStatus(STATUS.ERROR)
    }
  }, [hotspotId, mac])

  useEffect(() => { loadPortal() }, [loadPortal])

  // Nettoyage du polling
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // ── Handlers ────────────────────────────────────────────────────────

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan)
    setOperator(null)
    setPhone('')
  }

  const handleBackToPlans = () => {
    setSelectedPlan(null)
    setOperator(null)
    setPhone('')
  }

  // Paiement Mobile Money
  const handlePay = async () => {
    if (!selectedPlan || !phone || !operator) return
    setStatus(STATUS.PAYING)
    setStatusMessage('Initialisation du paiement...')
    try {
      const { data } = await portalApi.pay({
        hotspotId,
        planId: selectedPlan.planId || selectedPlan.id,
        phone: phone.startsWith('+') ? phone : `+237${phone}`,
        mac,
        operator,
      })
      if (data?.success && data?.data) {
        const ref = data.data.reference
        setPaymentRef(ref)
        setStatusMessage(data.data.message || 'Confirmez sur votre téléphone')
        startPolling(ref)
      } else {
        throw new Error(data?.message || 'Erreur de paiement')
      }
    } catch (err) {
      setStatusMessage(err?.response?.data?.message || err?.message || 'Erreur de paiement')
      setStatus(STATUS.FAILED)
    }
  }

  // Polling statut paiement
  const startPolling = (ref) => {
    let attempts = 0
    const maxAttempts = 72  // 6 minutes (5s × 72)

    pollingRef.current = setInterval(async () => {
      attempts++
      try {
        const { data } = await portalApi.paymentStatus(ref)
        if (data?.success && data?.data) {
          const d = data.data
          if (d.wifiActivated) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
            setSessionData(d.session || null)
            setStatus(STATUS.CONNECTED)
            // Sauvegarde des credentials paiement
            const cred = { type: 'payment', phone, reference: ref, operator, planName: selectedPlan?.name, hotspotName: hotspot?.hotspotName }
            saveCredentials(cred)
            setActiveCredentials(cred)
            return
          }
          if (d.activationPending) {
            setStatusMessage('✅ Paiement confirmé ! Activation WiFi en cours...')
            return
          }
          if (d.status === 'FAILED' || d.status === 'EXPIRED') {
            clearInterval(pollingRef.current)
            pollingRef.current = null
            setStatusMessage(d.message || 'Paiement échoué')
            setStatus(STATUS.FAILED)
            return
          }
          if (d.message) setStatusMessage(d.message)
        }
      } catch {
        // Silencieux — on réessaie
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
        setStatusMessage('Délai dépassé. Veuillez réessayer.')
        setStatus(STATUS.FAILED)
      }
    }, 5000)
  }

  // Connexion par ticket
  const handleTicketConnect = async () => {
    if (!ticketUser || !ticketPass) return
    setStatus(STATUS.CONNECTING)
    setStatusMessage('Validation du ticket...')
    try {
      const { data } = await portalApi.ticketConnect(hotspotId, {
        username: ticketUser,
        password: ticketPass,
        mac,
      })
      if (data?.success && data?.data) {
        setSessionData(data.data.session || data.data)
        setStatus(STATUS.CONNECTED)
        // Sauvegarde des credentials ticket
        const cred = { type: 'ticket', username: ticketUser, password: ticketPass, hotspotName: hotspot?.hotspotName }
        saveCredentials(cred)
        setActiveCredentials(cred)
      } else {
        throw new Error(data?.message || 'Ticket invalide')
      }
    } catch (err) {
      setStatusMessage(err?.response?.data?.message || err?.message || 'Ticket invalide')
      setStatus(STATUS.FAILED)
    }
  }

  const handleRetry = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setPaymentRef('')
    setSessionData(null)
    setSelectedPlan(null)
    setOperator(null)
    setPhone('')
    setTicketUser('')
    setTicketPass('')
    setStatusMessage('')
    setActiveCredentials(null)
    setShowCredentialsModal(false)
    setStatus(STATUS.IDLE)
  }

  // ── Rendu par état ──────────────────────────────────────────────────

  if (status === STATUS.LOADING) {
    return <PageShell><LoadingSkeleton /></PageShell>
  }

  if (status === STATUS.ERROR) {
    return (
      <PageShell>
        <ErrorDisplay message={error} onRetry={loadPortal} />
      </PageShell>
    )
  }

  // === CONNECTED ===
  if (status === STATUS.CONNECTED) {
    return (
      <PageShell>
        <SuccessScreen session={sessionData} hotspotName={hotspot?.hotspotName} credentials={activeCredentials} />
      </PageShell>
    )
  }

  // === FAILED ===
  if (status === STATUS.FAILED) {
    return (
      <PageShell>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 py-12 px-6 text-center"
        >
          <WifiSignalAnimation status="failed" size={100} />
          <div>
            <h2 className="text-[#F5F0EB] text-lg font-semibold mb-1">Connexion échouée</h2>
            <p className="text-[#6B6258] text-sm max-w-xs">{statusMessage || 'Une erreur est survenue'}</p>
          </div>
          <button onClick={handleRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] text-[#0C0A08] font-semibold text-sm hover:bg-[#D4880A] transition-colors active:scale-[0.97]"
          >
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </motion.div>
      </PageShell>
    )
  }

  // === PAYING / CONNECTING ===
  if (status === STATUS.PAYING || status === STATUS.CONNECTING) {
    return (
      <PageShell>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 py-12 px-6 text-center"
        >
          <WifiSignalAnimation status="processing" size={130} />
          <div>
            <h2 className="text-[#F5F0EB] text-base font-semibold mb-1">
              {status === STATUS.PAYING ? 'Paiement en cours' : 'Activation WiFi'}
            </h2>
            <p className="text-[#6B6258] text-sm max-w-xs">{statusMessage}</p>
          </div>

          {status === STATUS.PAYING && (
            <>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1C1713] border border-[#2A231D]">
                <RefreshCw className="w-3.5 h-3.5 text-[#F59E0B] animate-spin" />
                <span className="text-[#6B6258] text-xs">Vérification automatique toutes les 5s</span>
              </div>
              <button onClick={handleRetry}
                className="text-[#6B6258] text-xs underline hover:text-[#F5F0EB] transition-colors"
              >
                Annuler et revenir en arrière
              </button>
            </>
          )}
        </motion.div>
      </PageShell>
    )
  }

  // === IDLE — l'essentiel de la page ===
  const hasPlans = plans.length > 0
  const hasTickets = hotspot?.hasTickets || false

  return (
    <PageShell>
      {/* En-tête hotspot */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
        <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 flex items-center justify-center mx-auto mb-3">
          <Wifi className="w-6 h-6 text-[#F59E0B]" />
        </div>
        <h1 className="text-[#F5F0EB] text-xl font-bold">{hotspot?.hotspotName || 'Portail WiFi'}</h1>
        {hotspot?.location && (
          <p className="text-[#6B6258] text-xs mt-0.5">{hotspot.location}</p>
        )}
      </motion.div>

      {/* Tabs */}
      {(hasTickets || true) && (
        <div className="flex bg-[#1C1713] rounded-xl p-1 mb-5">
          <button
            onClick={() => { setTab('pay'); setSelectedPlan(null) }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all',
              tab === 'pay'
                ? 'bg-[#F59E0B] text-[#0C0A08] shadow-sm'
                : 'text-[#6B6258] hover:text-[#F5F0EB]'
            )}
          >
            <Smartphone className="w-3.5 h-3.5" /> Mobile Money
          </button>
          <button
            onClick={() => setTab('ticket')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all',
              tab === 'ticket'
                ? 'bg-[#F59E0B] text-[#0C0A08] shadow-sm'
                : 'text-[#6B6258] hover:text-[#F5F0EB]'
            )}
          >
            <Ticket className="w-3.5 h-3.5" /> J'ai un ticket
          </button>
        </div>
      )}

      {/* Contenu des tabs */}
      <AnimatePresence mode="wait">
        {tab === 'pay' ? renderPayTab() : renderTicketTab()}
      </AnimatePresence>

      {/* Footer */}
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="text-center text-[#6B6258] text-[10px] mt-6 flex items-center justify-center gap-1"
      >
        <Shield className="w-3 h-3" /> Paiement sécurisé — Propulsé par HotspotPay
      </motion.p>

      {/* Derniers credentials */}
      <AnimatePresence>
        {savedCredentials && <LastCredentialsBar credentials={savedCredentials} onView={() => setShowCredentialsModal(true)} />}
      </AnimatePresence>

      {/* Modale credentials */}
      <AnimatePresence>
        {showCredentialsModal && (
          <CredentialsModal credentials={savedCredentials} onClose={() => setShowCredentialsModal(false)} />
        )}
      </AnimatePresence>
    </PageShell>
  )

  // ── Rendu tabs (dans la closure) ─────────────────────────────────────

  function renderPayTab() {
    // Étape 2 : formulaire de paiement
    if (selectedPlan) {
      return (
        <motion.div key="pay-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          {/* Plan sélectionné — résumé cliquable */}
          <button onClick={handleBackToPlans}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1713] border-2 border-[#F59E0B]/30 hover:border-[#F59E0B]/60 transition-colors group"
          >
            <div className="text-left">
              <span className="text-[#F5F0EB] text-sm font-semibold block">{selectedPlan.name}</span>
              <span className="text-[#6B6258] text-[11px]">{formatDuration(selectedPlan.durationMinutes)} · {formatDataLimit(selectedPlan.dataLimitMb)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#F59E0B] text-sm font-bold">{formatPrice(selectedPlan.price, selectedPlan.currency)}</span>
              <ArrowLeft className="w-3.5 h-3.5 text-[#6B6258] group-hover:text-[#F5F0EB] transition-colors" />
            </div>
          </button>

          {/* Numéro de téléphone */}
          <div>
            <label className="text-[#6B6258] text-xs mb-1.5 block">Numéro Mobile Money</label>
            <div className="flex rounded-xl bg-[#1C1713] border border-[#2A231D] focus-within:border-[#F59E0B]/50 transition-colors overflow-hidden">
              <span className="flex items-center px-3 text-[#6B6258] text-sm border-r border-[#2A231D] shrink-0">+237</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="6XXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                className="flex-1 bg-transparent text-[#F5F0EB] text-sm px-3 py-3 outline-none placeholder:text-[#6B6258]"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Opérateur */}
          <div>
            <label className="text-[#6B6258] text-xs mb-1.5 block">Opérateur</label>
            <div className="grid grid-cols-2 gap-2">
              {OPERATORS.map(op => (
                <button
                  key={op.id}
                  onClick={() => setOperator(op.id)}
                  className={cn(
                    'flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs font-medium transition-all border',
                    operator === op.id
                      ? `bg-gradient-to-r ${op.color} text-white border-transparent shadow-lg`
                      : 'bg-[#1C1713] text-[#6B6258] border-[#2A231D] hover:border-[#6B6258] hover:text-[#F5F0EB]'
                  )}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bouton payer */}
          <button
            onClick={handlePay}
            disabled={!phone || !operator}
            className={cn(
              'w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98]',
              phone && operator
                ? 'bg-[#F59E0B] text-[#0C0A08] hover:bg-[#D4880A] shadow-lg shadow-[#F59E0B]/20'
                : 'bg-[#2A231D] text-[#6B6258] cursor-not-allowed'
            )}
          >
            Payer {selectedPlan ? formatPrice(selectedPlan.price, selectedPlan.currency) : ''}
          </button>
        </motion.div>
      )
    }

    // Étape 1 : sélection du forfait
    return (
      <motion.div key="pay-plans" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        {hasPlans ? (
          <div className="grid gap-2.5">
            {plans.map((plan, i) => (
              <motion.button
                key={plan.planId || plan.id || i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSelectPlan(plan)}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#1C1713] border border-[#2A231D] hover:border-[#F59E0B]/40 transition-all group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <div className="text-left">
                    <span className="text-[#F5F0EB] text-sm font-semibold block">{plan.name}</span>
                    <span className="text-[#6B6258] text-[11px]">
                      {formatDuration(plan.durationMinutes)}
                      {plan.dataLimitMb !== undefined && ` · ${formatDataLimit(plan.dataLimitMb)}`}
                      {plan.downloadSpeedKbps && ` · ${plan.downloadSpeedKbps} Kbps`}
                    </span>
                  </div>
                </div>
                <span className="text-[#F59E0B] text-sm font-bold">{formatPrice(plan.price, plan.currency)}</span>
              </motion.button>
            ))}
          </div>
        ) : (
          <ErrorDisplay message="Aucun forfait disponible pour ce hotspot" />
        )}
      </motion.div>
    )
  }

  function renderTicketTab() {
    return (
      <motion.div key="ticket-form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <div className="text-center mb-1">
          <p className="text-[#6B6258] text-xs">Entrez les identifiants fournis par la réception</p>
        </div>

        <div>
          <label className="text-[#6B6258] text-xs mb-1.5 block">Nom d'utilisateur</label>
          <input
            type="text"
            placeholder="Ex: ticket-001"
            value={ticketUser}
            onChange={e => setTicketUser(e.target.value)}
            className="w-full bg-[#1C1713] text-[#F5F0EB] text-sm px-4 py-3 rounded-xl border border-[#2A231D] outline-none placeholder:text-[#6B6258] focus:border-[#F59E0B]/50 transition-colors"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="text-[#6B6258] text-xs mb-1.5 block">Mot de passe</label>
          <input
            type="password"
            placeholder="••••••••"
            value={ticketPass}
            onChange={e => setTicketPass(e.target.value)}
            className="w-full bg-[#1C1713] text-[#F5F0EB] text-sm px-4 py-3 rounded-xl border border-[#2A231D] outline-none placeholder:text-[#6B6258] focus:border-[#F59E0B]/50 transition-colors"
            autoComplete="current-password"
          />
        </div>

        <button
          onClick={handleTicketConnect}
          disabled={!ticketUser || !ticketPass}
          className={cn(
            'w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98]',
            ticketUser && ticketPass
              ? 'bg-[#F59E0B] text-[#0C0A08] hover:bg-[#D4880A] shadow-lg shadow-[#F59E0B]/20'
              : 'bg-[#2A231D] text-[#6B6258] cursor-not-allowed'
          )}
        >
          <div className="flex items-center justify-center gap-2">
            <Wifi className="w-4 h-4" /> Se connecter
          </div>
        </button>
      </motion.div>
    )
  }
}

/* ── Page Shell (layout global) ───────────────────────────────────────── */

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-[#0C0A08] flex flex-col">
      {/* Barre supérieure */}
      <div className="w-full h-0.5 bg-gradient-to-r from-[#F59E0B]/0 via-[#F59E0B]/50 to-[#F59E0B]/0" />

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm mx-auto"
        >
          {children}
        </motion.div>
      </div>

      {/* Footer fixe */}
      <div className="text-center py-4">
        <p className="text-[#6B6258] text-[10px]">HotspotPay — Connexion WiFi instantanée</p>
      </div>
    </div>
  )
}

/* ── LastCredentialsBar ────────────────────────────────────────────────── */

function LastCredentialsBar({ credentials, onView }) {
  const icon = credentials?.type === 'ticket' ? credentials.username : credentials?.phone

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ delay: 0.4, duration: 0.3 }}
    >
      <button
        onClick={onView}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1713] border border-[#2A231D] hover:border-[#F59E0B]/30 transition-all group mt-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
            <Key className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-left min-w-0">
            <span className="text-[#F5F0EB] text-xs font-medium block truncate">
              Voir mes derniers credentials
            </span>
            <span className="text-[#6B6258] text-[10px] block truncate">
              {credentials?.hotspotName || ''}
              {icon && ` · ${icon}`}
              {credentials?.savedAt && ` · ${new Date(credentials.savedAt).toLocaleDateString()}`}
            </span>
          </div>
        </div>
        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
      </button>
    </motion.div>
  )
}

/* ── CredentialsModal ──────────────────────────────────────────────────── */

function CredentialsModal({ credentials, onClose }) {
  const [copiedField, setCopiedField] = useState(null)
  const [showPassword, setShowPassword] = useState(false)

  const copyField = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(label)
      setTimeout(() => setCopiedField(null), 2000)
    } catch { /* silencieux */ }
  }

  if (!credentials) return null

  const isTicket = credentials.type === 'ticket'
  const isPayment = credentials.type === 'payment'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm bg-[#0C0A08] border border-[#2A231D] rounded-2xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="text-[#F5F0EB] text-base font-bold">Mes credentials</h3>
            <p className="text-[#6B6258] text-[10px]">
              {credentials.hotspotName || 'Hotspot'}
              {credentials.savedAt && ` · ${new Date(credentials.savedAt).toLocaleString()}`}
            </p>
          </div>
        </div>

        {/* Contenu selon le type */}
        <div className="space-y-3">
          {/* ── Ticket ── */}
          {isTicket && (
            <>
              {/* Username */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1713] border border-[#2A231D]">
                <div className="text-left min-w-0 flex-1">
                  <span className="text-[#6B6258] text-[10px] block">Identifiant</span>
                  <span className="text-[#F5F0EB] text-sm font-mono truncate block">{credentials.username}</span>
                </div>
                <button onClick={() => copyField('user', credentials.username)}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6258] hover:text-[#F5F0EB] hover:bg-white/5 transition-all">
                  {copiedField === 'user' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {/* Password */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1713] border border-[#2A231D]">
                <div className="text-left min-w-0 flex-1">
                  <span className="text-[#6B6258] text-[10px] block">Mot de passe</span>
                  <span className="text-[#F5F0EB] text-sm font-mono truncate block">
                    {showPassword ? credentials.password : '••••••••'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowPassword(v => !v)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6258] hover:text-[#F5F0EB] hover:bg-white/5 transition-all">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => copyField('pass', credentials.password)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6258] hover:text-[#F5F0EB] hover:bg-white/5 transition-all">
                    {copiedField === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Paiement Mobile Money ── */}
          {isPayment && (
            <>
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1713] border border-[#2A231D]">
                <div className="text-left min-w-0 flex-1">
                  <span className="text-[#6B6258] text-[10px] block">Numéro Mobile Money</span>
                  <span className="text-[#F5F0EB] text-sm block">+237 {credentials.phone}</span>
                </div>
                <button onClick={() => copyField('phone', `+237${credentials.phone}`)}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6258] hover:text-[#F5F0EB] hover:bg-white/5 transition-all">
                  {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              {credentials.reference && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1713] border border-[#2A231D]">
                  <div className="text-left min-w-0 flex-1">
                    <span className="text-[#6B6258] text-[10px] block">Référence</span>
                    <span className="text-[#F5F0EB] text-sm font-mono truncate block">{credentials.reference}</span>
                  </div>
                  <button onClick={() => copyField('ref', credentials.reference)}
                    className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6258] hover:text-[#F5F0EB] hover:bg-white/5 transition-all">
                    {copiedField === 'ref' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
              {credentials.operator && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1713] border border-[#2A231D]">
                  <div className="text-left min-w-0 flex-1">
                    <span className="text-[#6B6258] text-[10px] block">Opérateur</span>
                    <span className="text-[#F5F0EB] text-sm block">
                      {credentials.operator === 'MTN_MOMO' ? 'MTN MoMo' : 'Orange Money'}
                    </span>
                  </div>
                </div>
              )}
              {credentials.planName && (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#1C1713] border border-[#2A231D]">
                  <div className="text-left min-w-0 flex-1">
                    <span className="text-[#6B6258] text-[10px] block">Forfait</span>
                    <span className="text-[#F5F0EB] text-sm block">{credentials.planName}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Copier tout ── */}
          <button
            onClick={async () => {
              let text = `=== HotspotPay Credentials ===\n`
              text += `Hotspot: ${credentials.hotspotName || ''}\n`
              if (isTicket) {
                text += `Identifiant: ${credentials.username}\n`
                text += `Mot de passe: ${credentials.password}\n`
              }
              if (isPayment) {
                text += `Mobile Money: +237${credentials.phone}\n`
                if (credentials.reference) text += `Référence: ${credentials.reference}\n`
                if (credentials.operator) text += `Opérateur: ${credentials.operator === 'MTN_MOMO' ? 'MTN MoMo' : 'Orange Money'}\n`
                if (credentials.planName) text += `Forfait: ${credentials.planName}\n`
              }
              text += `Date: ${credentials.savedAt ? new Date(credentials.savedAt).toLocaleString() : ''}\n`
              await navigator.clipboard.writeText(text)
              setCopiedField('all')
              setTimeout(() => setCopiedField(null), 2000)
            }}
            className="w-full py-3 rounded-xl text-xs font-medium transition-all border flex items-center justify-center gap-2
              bg-[#1C1713] border-[#2A231D] text-[#6B6258] hover:border-[#F59E0B]/30 hover:text-[#F5F0EB]"
          >
            {copiedField === 'all' ? (
              <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copié !</>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> Tout copier</>
            )}
          </button>
        </div>

        {/* Fermer */}
        <button onClick={onClose}
          className="w-full py-3 mt-3 rounded-xl bg-[#F59E0B] text-[#0C0A08] font-semibold text-sm hover:bg-[#D4880A] transition-colors active:scale-[0.98]"
        >
          Fermer
        </button>
      </motion.div>
    </motion.div>
  )
}

/* ── cn() helper (inline pour éviter dépendance circulaire) ──────────── */
function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
