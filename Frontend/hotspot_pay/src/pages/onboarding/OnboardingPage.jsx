/* eslint-disable react-hooks/purity */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useSelector, useDispatch } from 'react-redux'
import { ChevronLeft, ChevronRight, Sparkles, Moon, Sun, Globe, Wifi } from 'lucide-react'
import { motion } from 'framer-motion'
import { setUser } from '../../store/authSlice'
import { toggleTheme, toggleLocale } from '../../store/uiSlice'
import { hotspotsApi, usersApi } from '../../api/endpoints'
import AuthLoader from '../../components/loader/AuthLoader'
import { cn } from '../../utils/cn'
import { GlowingOrbs, Particles, StepIndicator, StepContent, SuccessScreen } from '../../components/onboarding'
import { STEPS } from '../../components/onboarding/constants'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const userEmail = useSelector((state) => state.auth.user?.email) || ''
  const theme = useSelector((state) => state.ui.theme)
  const locale = useSelector((state) => state.ui.locale)
  const isLight = theme === 'light'

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState('')
  const [hotspotCreated, setHotspotCreated] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const [form, setForm] = useState({
    fullName: '', email: userEmail,
    phone: '', country: '',
    hotspotName: '', location: '',
    mikrotikIp: '', mikrotikPort: '8728',
    mikrotikUser: '', mikrotikPassword: '',
  })

  // Synchroniser le thème sur <html> + scrollbar
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('light', theme === 'light')

    const id = 'hp-scroll-style'
    let el = document.getElementById(id)
    if (!el) {
      el = document.createElement('style')
      el.id = id
      document.head.appendChild(el)
    }
    el.textContent = `.step-scroll::-webkit-scrollbar{width:6px}.step-scroll::-webkit-scrollbar-thumb{border-radius:999px;background:var(--scrollbar-thumb)}.step-scroll::-webkit-scrollbar-track{background:transparent}`
  }, [theme])

  // Charger le profil utilisateur au montage
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await usersApi.me()
        if (data.success) {
          const p = data.data
          setForm(prev => ({
            ...prev,
            fullName: p.fullName || '',
            email: p.email || prev.email,
            phone: p.phone || '',
            country: p.country || '',
          }))
        }
      } catch {
        // silencieux
      } finally {
        setProfileLoading(false)
      }
    }
    loadProfile()
  }, [])

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const togglePwd = () => setShowPwd(s => !s)

  const validateIp = (ip) => /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(ip)
  const ipError = form.mikrotikIp && !validateIp(form.mikrotikIp) ? 'Format IP invalide (ex: 192.168.1.1)' : ''

  const canGoNext = () => {
    switch (step) {
      case 0: return true
      case 1: return form.hotspotName.trim().length > 0
      case 2: return form.mikrotikIp.trim().length > 0 && !ipError && form.mikrotikPort.trim().length > 0
      case 3: return form.mikrotikUser.trim().length > 0 && form.mikrotikPassword.trim().length >= 4
      default: return false
    }
  }

  const canSubmit = form.hotspotName.trim() && form.mikrotikIp.trim() && !ipError
    && form.mikrotikUser.trim() && form.mikrotikPassword.trim()

  const next = () => { if (canGoNext()) setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  const prev = () => setStep(s => Math.max(s - 1, 0))

  const handleCreate = async () => {
    setLoading(true); setError('')
    try {
      const profileUpdate = {}
      if (form.fullName.trim()) profileUpdate.fullName = form.fullName.trim()
      if (form.phone.trim()) profileUpdate.phone = form.phone.trim()
      if (form.country) profileUpdate.country = form.country
      if (Object.keys(profileUpdate).length > 0) {
        await usersApi.update(profileUpdate)
      }

      dispatch(setUser({ ...profileUpdate, email: form.email }))

      const { data } = await hotspotsApi.create({
        name: form.hotspotName.trim(),
        location: form.location.trim() || undefined,
        mikrotikIp: form.mikrotikIp.trim(),
        mikrotikPort: parseInt(form.mikrotikPort, 10) || 8728,
        mikrotikUser: form.mikrotikUser.trim(),
        mikrotikPassword: form.mikrotikPassword,
      })
      if (data.success) {
        setHotspotCreated(true)
        toast.success('Hotspot créé avec succès !')
      } else {
        setError(data.message || 'Erreur lors de la création')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => navigate('/dashboard', { replace: true })

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading && !hotspotCreated && !profileLoading) {
      if (step < STEPS.length - 1) next()
      else if (canSubmit) handleCreate()
    }
  }

  // ── Chargement du profil ──────────────────────────────────────
  if (profileLoading) {
    return (
      <div className={cn('h-screen w-full flex items-center justify-center relative overflow-hidden', isLight ? 'bg-slate-50' : 'bg-slate-950')}>
        <GlowingOrbs isLight={isLight} />
        <div className="relative z-10">
          <AuthLoader label="Chargement de votre profil..." />
        </div>
      </div>
    )
  }

  // ── Écran de succès ──────────────────────────────────────────
  if (hotspotCreated) {
    return <SuccessScreen form={form} isLight={isLight} onFinish={handleFinish} />
  }

  // ── Onboarding ───────────────────────────────────────────────
  return (
    <div
      className={cn('h-screen w-full flex flex-col overflow-hidden relative select-none transition-colors duration-200', isLight ? 'bg-slate-50' : 'bg-slate-950')}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <GlowingOrbs isLight={isLight} />
      <Particles count={10} isLight={isLight} />

      {/* Header logo + toggles */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Wifi className="w-4 h-4 text-white" />
          </div>
          <span className={cn('text-sm font-bold', isLight ? 'text-slate-800' : 'text-white')}>HotspotPay</span>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => dispatch(toggleTheme())}
            className={cn('p-2 rounded-xl transition-all', isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-500 hover:text-white hover:bg-slate-800/50')}
            title={isLight ? 'Mode sombre' : 'Mode clair'}>
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button onClick={() => dispatch(toggleLocale())}
            className={cn('flex items-center gap-1 px-2 py-2 rounded-xl transition-all text-xs font-medium', isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-500 hover:text-white hover:bg-slate-800/50')}
            title={locale === 'fr' ? 'English' : 'Français'}>
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">{locale === 'fr' ? 'FR' : 'EN'}</span>
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="relative z-10 flex justify-center pt-3 pb-2">
        <StepIndicator step={step} isLight={isLight} />
      </div>

      {/* Step label */}
      <div className="relative z-10 text-center pb-1">
        <span className={cn('text-[10px] font-medium uppercase tracking-widest', isLight ? 'text-slate-300' : 'text-slate-500')}>
          Étape {step + 1} sur {STEPS.length} — {STEPS[step].label}
        </span>
      </div>

      {/* Contenu centré */}
      <div className="relative z-10 flex-1 flex items-center justify-center min-h-0 py-2 overflow-hidden">
        <StepContent step={step} form={form} update={update} ipError={ipError} showPwd={showPwd} togglePwd={togglePwd} isLight={isLight} />
      </div>

      {/* Erreur */}
      {error && (
        <div className="relative z-10 text-center px-4 pb-1">
          <p className="text-[11px] text-red-400 bg-red-500/10 rounded-lg px-3 py-1.5 inline-block">{error}</p>
        </div>
      )}

      {/* Overlay chargement */}
      {loading && !hotspotCreated && (
        <div className={cn('absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm', isLight ? 'bg-white/80' : 'bg-slate-950/80')}>
          <AuthLoader label="Création de votre hotspot..." width="90px" />
        </div>
      )}

      {/* Navigation */}
      <div className="relative z-10 flex items-center justify-between px-6 pb-6 pt-3">
        <button onClick={prev} disabled={step === 0 || loading}
          className={cn('flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-medium transition-all',
            step === 0
              ? isLight ? 'text-slate-400 cursor-default' : 'text-slate-700 cursor-default'
              : isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800/50')}>
          <ChevronLeft className="w-3.5 h-3.5" />
          Retour
        </button>

        <div className="flex items-center gap-3">
          {step < STEPS.length - 1 ? (
            <button onClick={next} disabled={!canGoNext() || loading}
              className={cn('flex items-center gap-1.5 h-9 px-5 rounded-xl text-xs font-semibold transition-all',
                canGoNext() && !loading
                  ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                  : isLight ? 'bg-slate-200/50 text-slate-400 cursor-default' : 'bg-slate-800 text-slate-600 cursor-default')}>
              Suivant <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={handleCreate} disabled={!canSubmit || loading}
              className={cn('flex items-center gap-2 h-9 px-5 rounded-xl text-xs font-semibold transition-all',
                canSubmit && !loading
                  ? 'bg-linear-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                  : isLight ? 'bg-slate-200/50 text-slate-400 cursor-default' : 'bg-slate-800 text-slate-600 cursor-default')}>
              {loading ? 'Création...' : <><Sparkles className="w-3.5 h-3.5" /> Créer mon hotspot</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
