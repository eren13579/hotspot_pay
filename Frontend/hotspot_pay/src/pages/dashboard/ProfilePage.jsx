import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  User, Mail, Phone, Key, Shield, Crown, Wifi,
  Loader2, Eye, EyeOff, AlertCircle, Save,
  Fingerprint, Calendar, Smartphone, Check, X, Plug,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { usersApi, twoFactorApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'
import { formatDateTime } from '../../utils/format'
import { ConnectivityPulse } from '../../components/ui'

// ─── Animations ────────────────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 22 } },
}

// ─── Composants atomiques ──────────────────────────────────────────────────
function FieldLabel({ label, required }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function Input({ value, onChange, placeholder, type = 'text', readOnly, error, onFocus, onBlur, icon: Icon }) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className={cn('w-4 h-4', focused ? 'text-amber-400' : 'text-slate-500')} />
        </div>
      )}
      <input
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        readOnly={readOnly}
        onFocus={() => { setFocused(true); onFocus?.() }}
        onBlur={() => { setFocused(false); onBlur?.() }}
        className={cn(
          'w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200',
          'bg-slate-800/40 border placeholder:text-slate-600',
          readOnly && 'opacity-60 cursor-not-allowed',
          focused
            ? 'border-amber-500/60 shadow-lg shadow-amber-500/10'
            : error
              ? 'border-red-500/50 shadow-lg shadow-red-500/10'
              : 'border-slate-700/50 hover:border-slate-600/50',
          Icon && 'pl-11',
          'text-white',
        )}
      />
      {error && <p className="flex items-center gap-1 mt-1.5 text-[11px] text-red-400"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
  )
}

function PasswordInput({ value, onChange, placeholder, error, onBlur }) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <div className="relative">
        <Key className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4', focused ? 'text-amber-400' : 'text-slate-500')} />
        <input
          value={value}
          onChange={onChange}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.() }}
          autoComplete="new-password"
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 pr-11',
            'bg-slate-800/40 border placeholder:text-slate-600',
            focused
              ? 'border-amber-500/60 shadow-lg shadow-amber-500/10'
              : error
                ? 'border-red-500/50 shadow-lg shadow-red-500/10'
                : 'border-slate-700/50 hover:border-slate-600/50',
            'pl-11 text-white',
          )}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="flex items-center gap-1 mt-1.5 text-[11px] text-red-400"><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
  )
}

function Badge({ children, color = 'slate', icon: Icon, dot }) {
  const colors = {
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    gold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border', colors[color] || colors.slate)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  )
}

// ─── Carte de détail (mini stat card) ─────────────────────────────────────
function DetailCard({ icon: Icon, label, value, color = 'blue' }) {
  const iconColors = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4 flex flex-col items-center text-center gap-2 hover:border-slate-700/80 transition-all duration-200">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', iconColors[color] || iconColors.blue)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ─── Squelette de chargement ──────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-800" />
        <div className="space-y-2">
          <div className="h-6 w-44 bg-slate-800 rounded-lg" />
          <div className="h-4 w-32 bg-slate-800 rounded-lg" />
        </div>
      </div>
      {/* Two-column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-4">
          <div className="h-5 w-36 bg-slate-800 rounded-lg" />
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-800 rounded-xl" />)}
        </div>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-4">
          <div className="h-5 w-44 bg-slate-800 rounded-lg" />
          {[1, 2].map((i) => <div key={i} className="h-12 bg-slate-800 rounded-xl" />)}
        </div>
      </div>
      {/* Details cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-slate-800 mx-auto" />
            <div className="h-3 w-16 bg-slate-800 rounded mx-auto" />
            <div className="h-4 w-20 bg-slate-800 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, role } = useSelector((state) => state.auth)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const [profile, setProfile] = useState(null)
  const [planInfo, setPlanInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '',
    password: '', confirmPassword: '',
    autoConnect: false,
  })
  const [formErrors, setFormErrors] = useState({})
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [twoFactorSetup, setTwoFactorSetup] = useState(null)
  const [totpCode, setTotpCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)

  const validateField = (field, value) => {
    setFormErrors((prev) => {
      const next = { ...prev }
      if (field === 'password' && value && value.length < 8) {
        next.password = 'Minimum 8 caractères'
      } else if (field === 'password') {
        delete next.password
      }
      if (field === 'confirmPassword' && value && form.password !== value) {
        next.confirmPassword = 'Les mots de passe ne correspondent pas'
      } else if (field === 'confirmPassword') {
        delete next.confirmPassword
      }
      return next
    })
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [meRes, planRes] = await Promise.allSettled([
          usersApi.me(),
          usersApi.planInfo(),
        ])
        if (meRes.status === 'fulfilled') {
          const u = meRes.value?.data?.data || meRes.value?.data
          setProfile(u)
          setForm({
            fullName: u.fullName || u.full_name || '',
            phone: u.phone || '',
            email: u.email || '',
            password: '',
            confirmPassword: '',
            autoConnect: u.autoConnect ?? false,
          })
        } else {
          setError(meRes.reason?.message || 'Impossible de charger le profil')
        }
        if (planRes.status === 'fulfilled') {
          setPlanInfo(planRes.value?.data?.data || null)
        }
      } catch (err) {
        setError(err.message || 'Erreur inattendue')
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    // Charger le statut 2FA
    twoFactorApi.status()
      .then(({ data }) => setTwoFactorEnabled(data?.data?.enabled || false))
      .catch(() => {}) // Silencieux — la 2FA n'est pas critique pour le profil
  }, [])

  const handleSave = async () => {
    if (!form.fullName.trim()) { toast.error('Le nom est requis'); return }
    if (form.password || form.confirmPassword) {
      if (!form.password) { toast.error('Entrez un nouveau mot de passe'); return }
      if (!form.confirmPassword) { toast.error('Confirmez le mot de passe'); return }
      if (form.password !== form.confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return }
      if (form.password.length < 8) { toast.error('Minimum 8 caractères'); return }
    }
    setSaving(true)
    try {
      const updateData = { fullName: form.fullName, phone: form.phone, autoConnect: form.autoConnect }
      if (form.password) updateData.password = form.password
      const { data } = await usersApi.update(updateData)
      if (data?.success) {
        toast.success('Profil mis à jour avec succès')
        setProfile((prev) => ({ ...prev, ...form }))
        setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }))
        setFormErrors({})
      } else {
        toast.error(data?.message || 'Erreur lors de la mise à jour')
      }
    } catch {
      toast.error('Erreur réseau lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  // ── États ──
  if (loading) return <ProfileSkeleton />

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-xs text-slate-400">Impossible de charger votre profil</p>
          <p className="text-sm text-red-400 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all cursor-pointer active:scale-[0.97]"
          >
            <Loader2 className="w-3.5 h-3.5" />
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!profile) return <Navigate to="/dashboard" replace />

  const roleColor = role === 'SUPER_ADMIN' ? 'amber' : role === 'ADMIN' ? 'blue' : 'slate'
  const planLabel = (profile.planType || profile.plan_type) === 'PREMIUM' ? 'Premium'
    : (profile.planType || profile.plan_type) === 'PRO' ? 'Pro'
    : 'Standard'
  const planColor = (profile.planType || profile.plan_type) === 'PREMIUM' ? 'amber'
    : (profile.planType || profile.plan_type) === 'PRO' ? 'blue' : 'slate'
  const isActive = profile.isActive !== false && profile.is_active !== false
  const displayName = profile.fullName || profile.email || 'Utilisateur'
  const initials = ((profile.fullName || profile.email || 'U').match(/\b\w/g) || ['U']).slice(0, 2).join('').toUpperCase()

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* ══════════ HEADER — Identité ══════════ */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-black/20 p-6">
        {/* Halo décoratif */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative flex items-center gap-5">
          {/* Avatar avec double pulse */}
          <div className="relative shrink-0">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white',
              'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700',
              'shadow-xl shadow-amber-500/20',
            )}>
              {initials}
            </div>
            {isActive && (
              <div className="absolute -top-1 -right-1">
                <ConnectivityPulse active size="sm" />
              </div>
            )}
          </div>

          {/* Identité */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black tracking-tight text-white truncate">
              {profile.fullName || 'Mon profil'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {profile.email || ''}
            </p>
          </div>

          {/* Badges */}
          <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
            {isAdmin && (
              <Badge color={roleColor} icon={Shield}>
                {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
              </Badge>
            )}
            <Badge color={planColor} icon={Crown}>
              {planLabel}
            </Badge>
          </div>
          {/* Badges mobiles */}
          <div className="flex sm:hidden flex-col items-end gap-1.5 shrink-0">
            {isAdmin && (
              <Badge color={roleColor} icon={Shield}>
                {role === 'SUPER_ADMIN' ? 'SA' : 'Admin'}
              </Badge>
            )}
            <Badge color={planColor}>
              {planLabel}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* ══════════ ROW : Infos personnelles + Mot de passe ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ─── Carte : Informations personnelles ─── */}
        <motion.div variants={item} className="relative rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-black/20 hover:border-slate-700/80 transition-all duration-300">
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Informations personnelles</h2>
                <p className="text-[10px] text-slate-500">Nom, email et téléphone</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <FieldLabel label="Nom complet" required />
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Votre nom complet"
                  icon={User}
                />
              </div>
              <div>
                <FieldLabel label="Email" />
                <Input value={form.email} readOnly icon={Mail} />
                <p className="text-[10px] text-slate-600 mt-1.5">L'email ne peut pas être modifié</p>
              </div>
              <div>
                <FieldLabel label="Téléphone" />
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+237 6XX XXX XXX"
                  icon={Phone}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Carte : Sécurité ─── */}
        <motion.div variants={item} className="relative rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-black/20 hover:border-slate-700/80 transition-all duration-300">
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Key className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Mot de passe</h2>
                <p className="text-[10px] text-slate-500">Laissez vide pour conserver l'actuel</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <FieldLabel label="Nouveau mot de passe" />
                <PasswordInput
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="8 caractères minimum"
                  error={formErrors.password}
                  onBlur={() => validateField('password', form.password)}
                />
              </div>
              <div>
                <FieldLabel label="Confirmer" />
                <PasswordInput
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Répétez le mot de passe"
                  error={formErrors.confirmPassword}
                  onBlur={() => validateField('confirmPassword', form.confirmPassword)}
                />
              </div>
            </div>

            {/* Bouton sauvegarder intégré */}
            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  'w-full inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200',
                  'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400',
                  'text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'active:scale-[0.97]',
                )}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Sauvegarde…' : 'Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══════════ 2FA ══════════ */}
      <motion.div variants={item}>
        <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-black/20 p-5 hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center',
              twoFactorEnabled
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-slate-500/10 border-slate-500/20')}>
              <Smartphone className={cn('w-4 h-4', twoFactorEnabled ? 'text-emerald-400' : 'text-slate-400')} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white">Authentification à deux facteurs</h2>
              <p className="text-[10px] text-slate-500">
                {twoFactorEnabled
                  ? 'Votre compte est sécurisé par 2FA'
                  : 'Ajoutez une couche de sécurité supplémentaire'}
              </p>
            </div>
            <div className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold border',
              twoFactorEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20')}>
              {twoFactorEnabled ? 'Activé' : 'Désactivé'}
            </div>
          </div>

          {twoFactorEnabled ? (
            /* ── 2FA activée → désactivation ── */
            <div className="space-y-3">
              {!showDisableConfirm ? (
                <button onClick={() => setShowDisableConfirm(true)}
                  className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-colors cursor-pointer">
                  Désactiver la 2FA
                </button>
              ) : (
                <div className={cn('rounded-xl border p-4 space-y-3', 'bg-slate-800/30 border-slate-700')}>
                  <p className="text-[11px] text-slate-400">
                    Veuillez entrer votre mot de passe pour désactiver la 2FA.
                  </p>
                  <input type="password" value={disablePassword}
                    onChange={e => setDisablePassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    className="w-full px-3 py-2 rounded-lg border bg-slate-800/50 border-slate-700 text-white text-xs placeholder:text-slate-500 outline-none" />
                  <div className="flex items-center gap-2">
                    <button onClick={async () => {
                      if (!disablePassword) { toast.error('Mot de passe requis'); return }
                      setTwoFactorLoading(true)
                      try {
                        await twoFactorApi.disable(disablePassword)
                        setTwoFactorEnabled(false)
                        setShowDisableConfirm(false)
                        setDisablePassword('')
                        toast.success('2FA désactivée')
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Erreur de désactivation')
                      } finally { setTwoFactorLoading(false) }
                    }} disabled={twoFactorLoading}
                      className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer">
                      {twoFactorLoading ? 'Désactivation...' : 'Confirmer la désactivation'}
                    </button>
                    <button onClick={() => { setShowDisableConfirm(false); setDisablePassword('') }}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-[11px] hover:bg-slate-800 transition-colors cursor-pointer">
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : twoFactorSetup ? (
            /* ── Configuration 2FA en cours ── */
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-3">
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG value={twoFactorSetup.qrUri} size={160} />
                </div>
                <p className="text-[11px] text-slate-400 text-center max-w-xs">
                  Scannez ce code avec Google Authenticator, Authy ou toute autre application TOTP.
                </p>
                <div className={cn('rounded-xl border p-3 w-full', 'bg-slate-800/30 border-slate-700')}>
                  <p className="text-[10px] text-slate-500 mb-1">Ou saisissez la clé manuellement :</p>
                  <p className="text-xs font-mono text-slate-300 break-all select-all">{twoFactorSetup.secret}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-medium">Code de vérification</label>
                <input type="text" inputMode="numeric" maxLength={6} value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-3 py-2.5 rounded-lg border bg-slate-800/50 border-slate-700 text-white text-center text-lg font-mono tracking-widest placeholder:text-slate-500 outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={async () => {
                  if (totpCode.length < 6) { toast.error('Entrez le code à 6 chiffres'); return }
                  setTwoFactorLoading(true)
                  try {
                    await twoFactorApi.enable(twoFactorSetup.secret, parseInt(totpCode))
                    setTwoFactorEnabled(true)
                    setTwoFactorSetup(null)
                    setTotpCode('')
                    toast.success('2FA activée avec succès')
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Code invalide')
                  } finally { setTwoFactorLoading(false) }
                }} disabled={twoFactorLoading || totpCode.length < 6}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer">
                  {twoFactorLoading ? 'Vérification...' : 'Activer la 2FA'}
                </button>
                <button onClick={() => { setTwoFactorSetup(null); setTotpCode('') }}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-slate-400 text-[11px] hover:bg-slate-800 transition-colors cursor-pointer">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            /* ── 2FA désactivée → activation ── */
            <button onClick={async () => {
              setTwoFactorLoading(true)
              try {
                const { data } = await twoFactorApi.setup()
                setTwoFactorSetup(data?.data || null)
              } catch (err) {
                toast.error(err.response?.data?.message || 'Erreur de configuration')
              } finally { setTwoFactorLoading(false) }
            }} disabled={twoFactorLoading}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer">
              {twoFactorLoading ? 'Préparation...' : 'Activer la 2FA'}
            </button>
          )}
        </div>
      </motion.div>

      {/* ══════════ Détails du compte (mini cartes) ══════════ */}
      <motion.div variants={item}>
        <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-black/20 p-5 hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Détails du compte</h2>
              <p className="text-[10px] text-slate-500">Rôle, plan et statut</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <DetailCard
              icon={Fingerprint}
              label="ID Utilisateur"
              value={(profile?.userId || profile?.user_id || '—').slice(0, 8) + '…'}
              color="slate"
            />
            <DetailCard
              icon={Shield}
              label="Rôle"
              value={role || profile?.role || '—'}
              color={roleColor}
            />
            <DetailCard
              icon={Crown}
              label="Plan"
              value={planLabel}
              color={planColor}
            />
            <DetailCard
              icon={Calendar}
              label="Membre depuis"
              value={profile?.createdAt ? formatDateTime(profile.createdAt).split(' ')[0] : profile?.created_at ? formatDateTime(profile.created_at).split(' ')[0] : '—'}
              color={isActive ? 'emerald' : 'slate'}
            />
          </div>
          {!isActive && (
            <div className="mt-3 flex items-center justify-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-[10px] text-red-400 font-medium">Compte inactif</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ══════════ Utilisation du plan ══════════ */}
      {planInfo && (
        <motion.div variants={item}>
          <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-black/20 p-5 hover:border-slate-700/80 transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Wifi className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Utilisation du plan</h2>
                <p className="text-[10px] text-slate-500">Hotspots et ressources</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Hotspots utilisés</span>
                <span className="text-xs font-semibold text-white tabular-nums">
                  {planInfo.currentHotspots ?? planInfo.current_hotspots ?? 0}
                  <span className="text-slate-600"> / </span>
                  {planInfo.maxHotspots ?? planInfo.max_hotspots ?? '∞'}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(
                      ((planInfo.currentHotspots ?? planInfo.current_hotspots ?? 0) /
                        (planInfo.maxHotspots ?? 1)) * 100,
                      100,
                    )}%`,
                  }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 shadow-lg shadow-amber-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-slate-800/30 p-3 text-center">
                  <p className="text-lg font-bold text-white tabular-nums">{planInfo.totalSessions ?? planInfo.total_sessions ?? 0}</p>
                  <p className="text-[10px] text-slate-500">Sessions</p>
                </div>
                <div className="rounded-lg bg-slate-800/30 p-3 text-center">
                  <p className="text-lg font-bold text-white tabular-nums">{planInfo.totalRevenue ? `${(planInfo.totalRevenue / 1000).toFixed(0)}k` : planInfo.total_revenue ? `${(planInfo.total_revenue / 1000).toFixed(0)}k` : '—'}</p>
                  <p className="text-[10px] text-slate-500">Revenu généré</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════ Connexion automatique ══════════ */}
      <motion.div variants={item}>
        <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl shadow-xl shadow-black/20 p-5 hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0',
              form.autoConnect
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-slate-500/10 border-slate-500/20')}>
              <Plug className={cn('w-5 h-5', form.autoConnect ? 'text-amber-400' : 'text-slate-400')} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-white">Connexion automatique</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5 max-w-md">
                    Après un paiement, le client est immédiatement connecté au WiFi sans avoir à saisir ses identifiants manuellement.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.autoConnect}
                  onClick={() => {
                    const newVal = !form.autoConnect
                    setForm(prev => ({ ...prev, autoConnect: newVal }))
                    // Sauvegarde automatique
                    setSaving(true)
                    usersApi.update({ autoConnect: newVal })
                      .then(({ data }) => {
                        if (data?.success) {
                          toast.success(newVal ? 'Connexion automatique activée' : 'Connexion manuelle activée')
                        }
                      })
                      .catch(() => toast.error('Erreur lors de la mise à jour'))
                      .finally(() => setSaving(false))
                  }}
                  disabled={saving}
                  className={cn(
                    'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    form.autoConnect ? 'bg-amber-500' : 'bg-slate-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  <span className={cn(
                    'pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                    form.autoConnect ? 'translate-x-5' : 'translate-x-0',
                  )} />
                </button>
              </div>
              <div className={cn(
                'mt-3 rounded-xl border p-3 flex items-start gap-2.5',
                form.autoConnect
                  ? 'bg-amber-500/5 border-amber-500/10'
                  : 'bg-blue-500/5 border-blue-500/10',
              )}>
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                  form.autoConnect ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400',
                )}>
                  {form.autoConnect ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </div>
                <p className={cn('text-[11px] leading-relaxed', form.autoConnect ? 'text-amber-300/80' : 'text-blue-300/80')}>
                  {form.autoConnect
                    ? 'Le client sera automatiquement connecté au WiFi après un paiement réussi. Aucune saisie manuelle requise.'
                    : 'Le client devra saisir manuellement ses identifiants (reçus par email/SMS) pour se connecter au WiFi après le paiement.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
