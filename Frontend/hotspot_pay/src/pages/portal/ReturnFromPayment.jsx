import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, Wifi, RefreshCw, Clock, Copy, Check, Eye, EyeOff, ArrowRight, Home } from 'lucide-react'
import { portalApi } from '../../api/endpoints'
import WifiSignalAnimation from '../../components/portal/WifiSignalAnimation'

/* ── États ──────────────────────────────────────────────────────────── */
const STATUS = {
  CHECKING: 'checking',
  PAID_NOT_ACTIVATED: 'paid_not_activated',
  CREDENTIALS_READY: 'credentials_ready',
  CONNECTED: 'connected',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return ''
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ''}`
}

/* ── Récupération du portail d'origine ────────────────────────────────── */

function getPortalReturn() {
  try {
    const raw = localStorage.getItem('portal_return')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function PortalReturnLink() {
  const saved = getPortalReturn()
  const href = saved?.hotspotId
    ? `/portal/${saved.hotspotId}${saved.mac ? '?mac=' + saved.mac : ''}`
    : '/portal'

  return (
    <Link to={href}
      className="text-[#6B6258] text-xs underline hover:text-[#F5F0EB] transition-colors"
    >
      Retour au portail WiFi
    </Link>
  )
}

/* ── Sous-composants ─────────────────────────────────────────────────── */

function CheckingScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <WifiSignalAnimation status="processing" size={100} />
      <p className="text-[#6B6258] text-sm animate-pulse">Vérification du paiement...</p>
    </div>
  )
}

function ConnectedScreen({ session, credentials }) {
  const [copiedField, setCopiedField] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const copiedTimer = useRef(null)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const copyField = (label, value) => {
    navigator.clipboard.writeText(value)
    setCopiedField(label)
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center gap-6 py-10 px-6 text-center"
    >
      {/* Icône succès */}
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-emerald-400" />
      </div>

      <div>
        <h2 className="text-[#F5F0EB] text-xl font-bold mb-1">✅ Paiement confirmé !</h2>
        <p className="text-[#6B6258] text-sm">
          {credentials?.hotspotName ? `WiFi ${credentials.hotspotName}` : 'Votre accès WiFi est prêt'}
        </p>
      </div>

      {/* Credentials */}
      {credentials && (credentials.username || credentials.password) && (
        <div className="w-full max-w-xs space-y-2">
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
        </div>
      )}

      {/* Session info */}
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
              <span className="text-[#6B6258] text-xs flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Expire à</span>
              <span className="text-[#F5F0EB] text-sm font-medium">{new Date(session.expiresAt).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Référence */}
      {credentials?.reference && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1C1713] border border-[#2A231D]">
          <span className="text-[#6B6258] text-[10px]">Réf: {credentials.reference.slice(0, 8)}...</span>
        </div>
      )}

      {countdown > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-xs font-medium">Redirection vers le portail dans {countdown}s</span>
        </div>
      )}

      <PortalReturnLink />
    </motion.div>
  )
}

function CredentialsReadyView({ credentials, onConnect, onRetry }) {
  const [copiedField, setCopiedField] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const copiedTimer = useRef(null)

  const copyField = (label, value) => {
    navigator.clipboard.writeText(value)
    setCopiedField(label)
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center gap-6 py-10 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>

      <div>
        <h2 className="text-[#F5F0EB] text-xl font-bold mb-1">✅ Paiement confirmé !</h2>
        <p className="text-[#6B6258] text-xs max-w-xs">
          {credentials?.hotspotName ? `WiFi ${credentials.hotspotName}` : 'Vos identifiants WiFi sont prêts'}
        </p>
        <p className="text-[#6B6258] text-[11px] mt-2 max-w-xs">
          Connectez-vous au réseau WiFi et entrez ces identifiants.
        </p>
      </div>

      {credentials && (credentials.username || credentials.password) && (
        <div className="w-full max-w-xs space-y-2">
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
        </div>
      )}

      <button onClick={onConnect}
        className="flex items-center justify-center gap-2 w-full max-w-xs py-3.5 rounded-xl bg-[#F59E0B] text-[#0C0A08] font-bold text-sm hover:bg-[#D4880A] transition-all active:scale-[0.98] shadow-lg shadow-[#F59E0B]/20"
      >
        <Wifi className="w-4 h-4" /> Se connecter au WiFi
      </button>

      <button onClick={onRetry}
        className="text-[#6B6258] text-xs underline hover:text-[#F5F0EB] transition-colors"
      >
        <ArrowRight className="w-3 h-3 inline" /> Retour au portail
      </button>
    </motion.div>
  )
}

function FailedScreen({ message, reference, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-12 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-400" />
      </div>
      <div>
        <h2 className="text-[#F5F0EB] text-lg font-semibold mb-1">Paiement échoué</h2>
        <p className="text-[#6B6258] text-sm max-w-xs">{message || 'Le paiement a été annulé ou a échoué.'}</p>
        {reference && (
          <p className="text-[#6B6258] text-[10px] mt-2">Réf: {reference.slice(0, 12)}...</p>
        )}
      </div>

      <Link to={onRetry || '/'}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] text-[#0C0A08] font-semibold text-sm hover:bg-[#D4880A] transition-colors active:scale-[0.97]"
      >
        <RefreshCw className="w-4 h-4" /> Réessayer
      </Link>
    </motion.div>
  )
}

function TimeoutScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-12 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
        <Clock className="w-7 h-7 text-[#F59E0B]" />
      </div>
      <div>
        <h2 className="text-[#F5F0EB] text-lg font-semibold mb-1">Encore un instant...</h2>
        <p className="text-[#6B6258] text-sm max-w-xs">
          Le paiement a bien été reçu, mais l'activation WiFi prend plus de temps que prévu.
        </p>
      </div>

      <Link to="/"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] text-[#0C0A08] font-semibold text-sm hover:bg-[#D4880A] transition-colors active:scale-[0.97]"
      >
        <Home className="w-4 h-4" /> Retour à l'accueil
      </Link>
    </motion.div>
  )
}

/* ── Composant principal ─────────────────────────────────────────────── */

export default function ReturnFromPayment() {
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('reference')

  const [status, setStatus] = useState(STATUS.CHECKING)
  const [credentials, setCredentials] = useState(null)
  const [session, setSession] = useState(null)
  const [failMessage, setFailMessage] = useState('')
  const pollingRef = useRef(null)

  // ── Vérification ─────────────────────────────────────────────────────

  const checkStatus = async (ref) => {
    try {
      const { data } = await portalApi.paymentStatus(ref)
      if (data?.success && data?.data) {
        const d = data.data
        if (d.wifiActivated) {
          cleanPolling()
          setSession(d.session || null)
          setCredentials({
            username: d.manualUsername,
            password: d.manualPassword,
            hotspotName: d.hotspotName,
            reference: ref,
          })
          setStatus(STATUS.CONNECTED)
          return 'done'
        }
        if (d.credentialsAvailable) {
          cleanPolling()
          setCredentials({
            username: d.manualUsername,
            password: d.manualPassword,
            hotspotName: d.hotspotName,
            reference: ref,
          })
          setStatus(STATUS.CREDENTIALS_READY)
          return 'done'
        }
        if (d.activationPending) {
          setStatus(STATUS.PAID_NOT_ACTIVATED)
          return 'pending'
        }
        if (d.status === 'FAILED' || d.status === 'EXPIRED') {
          cleanPolling()
          setFailMessage(d.message || 'Paiement échoué')
          setStatus(STATUS.FAILED)
          return 'done'
        }
      }
      return 'pending'
    } catch {
      return 'pending'
    }
  }

  const cleanPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  // ── Effet principal ──────────────────────────────────────────────────

  useEffect(() => {
    if (!reference) {
      setFailMessage('Aucune référence de paiement trouvée.')
      setStatus(STATUS.FAILED)
      return
    }

    // Vérification immédiate
    checkStatus(reference).then(result => {
      if (result === 'done') return

      // Polling 5s
      let attempts = 0
      const maxAttempts = 72 // 6 min

      pollingRef.current = setInterval(async () => {
        attempts++
        const r = await checkStatus(reference)
        if (r === 'done') return

        if (attempts >= maxAttempts) {
          cleanPolling()
          setStatus(STATUS.TIMEOUT)
        }
      }, 5000)
    })

    return cleanPolling
  }, [reference])

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleConnect = async () => {
    if (!reference) return
    setStatus(STATUS.CHECKING)
    const t = setTimeout(() => {
      checkStatus(reference)
    }, 500)
    return () => clearTimeout(t)
  }

  const handleRetry = () => {
    const saved = getPortalReturn()
    const portalUrl = saved?.hotspotId
      ? window.location.origin + '/portal/' + saved.hotspotId + (saved.mac ? '?mac=' + saved.mac : '')
      : credentials?.hotspotName
        ? window.location.origin + '/portal'
        : '/'
    window.location.href = portalUrl
  }

  // ── Render ───────────────────────────────────────────────────────────

  // Pas de référence → erreur
  if (!reference) {
    return <PageShell><FailedScreen message="Aucune référence de paiement." onRetry="/" /></PageShell>
  }

  // Vérification
  if (status === STATUS.CHECKING || status === STATUS.PAID_NOT_ACTIVATED) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-6 py-12 px-6 text-center">
          <WifiSignalAnimation status="processing" size={120} />
          <div>
            <h2 className="text-[#F5F0EB] text-base font-semibold mb-1">
              {status === STATUS.PAID_NOT_ACTIVATED
                ? '✅ Paiement reçu — Activation en cours...'
                : 'Vérification du paiement...'}
            </h2>
            <p className="text-[#6B6258] text-sm max-w-xs">
              {status === STATUS.PAID_NOT_ACTIVATED
                ? 'L\'activation de votre session WiFi est en cours. Cela prend quelques secondes.'
                : 'Veuillez patienter pendant que nous vérifions votre paiement.'}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1C1713] border border-[#2A231D]">
            <RefreshCw className="w-3.5 h-3.5 text-[#F59E0B] animate-spin" />
            <span className="text-[#6B6258] text-xs">Vérification automatique toutes les 5s</span>
          </div>
        </div>
      </PageShell>
    )
  }

  // Connecté
  if (status === STATUS.CONNECTED) {
    return (
      <PageShell>
        <ConnectedScreen session={session} credentials={credentials} />
      </PageShell>
    )
  }

  // Credentials prêts (connexion manuelle)
  if (status === STATUS.CREDENTIALS_READY) {
    return (
      <PageShell>
        <CredentialsReadyView
          credentials={credentials}
          onConnect={handleConnect}
          onRetry={handleRetry}
        />
      </PageShell>
    )
  }

  // Timeout
  if (status === STATUS.TIMEOUT) {
    return (
      <PageShell>
        <TimeoutScreen />
      </PageShell>
    )
  }

  // Échec
  return (
    <PageShell>
      <FailedScreen message={failMessage} reference={reference} onRetry={handleRetry} />
    </PageShell>
  )
}

/* ── PageShell ───────────────────────────────────────────────────────── */

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-[#0C0A08] flex flex-col">
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
      <div className="text-center py-4">
        <p className="text-[#6B6258] text-[10px]">HotspotPay — Connexion WiFi instantanée</p>
      </div>
    </div>
  )
}
