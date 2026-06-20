import { useState, useEffect } from 'react'
import { User, Mail, Phone, Key, Shield, Crown, Loader2, Eye, EyeOff, AlertCircle, Save, Wifi } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { usersApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'
import { formatDateTime } from '../../utils/format'
import SectionCard from './SectionCard'

/** Props : isLight, textPrimary, textSecondary, textMuted, cardCls */
export default function ProfileTab({ isLight, ...theme }) {
  const textPrimary = theme.textPrimary || (isLight ? 'text-slate-900' : 'text-white')
  const textSecondary = theme.textSecondary || (isLight ? 'text-slate-500' : 'text-slate-400')
  const textMuted = theme.textMuted || (isLight ? 'text-slate-400' : 'text-slate-500')
  const cardCls = theme.cardCls || (isLight ? 'bg-white border border-slate-200 shadow-sm' : 'bg-slate-900/50 border border-slate-800')

  const inputCls = (focused) => cn(
    'w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border',
    isLight
      ? (`bg-slate-50 border-slate-200 text-slate-900 ${focused ? 'border-blue-400' : ''}`)
      : (`bg-slate-800/50 border-slate-700 text-white ${focused ? 'border-blue-500' : ''}`)
  )

  const [profile, setProfile] = useState(null)
  const [planInfo, setPlanInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirmPassword: '' })
  const [fieldFocused, setFieldFocused] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateField = (field, value) => {
    const errors = { ...formErrors }
    if (field === 'password' && value && value.length < 8) {
      errors.password = 'Minimum 8 caractères'
    } else if (field === 'password') {
      delete errors.password
    }
    if (field === 'confirmPassword' && value && form.password !== value) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas'
    } else if (field === 'confirmPassword') {
      delete errors.confirmPassword
    }
    setFormErrors(errors)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); setError(null)
        const [meRes, planRes] = await Promise.allSettled([
          usersApi.me(),
          usersApi.planInfo(),
        ])
        if (meRes.status === 'fulfilled') {
          const u = meRes.value?.data?.data || meRes.value?.data
          setProfile(u)
          setForm({ fullName: u.fullName || u.full_name || '', phone: u.phone || '', email: u.email || '', password: '', confirmPassword: '' })
        }
        if (planRes.status === 'fulfilled') {
          setPlanInfo(planRes.value?.data?.data || null)
        }
      } catch (err) {
        setError(err.message || 'Erreur')
      } finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const handleSave = async () => {
    if (!form.fullName) { toast.error('Le nom est requis'); return }
    if (form.password || form.confirmPassword) {
      if (!form.password) { toast.error('Entrez un nouveau mot de passe'); return }
      if (!form.confirmPassword) { toast.error('Confirmez votre nouveau mot de passe'); return }
      if (form.password !== form.confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return }
      if (form.password.length < 8) { toast.error('Le mot de passe doit contenir au moins 8 caractères'); return }
    }
    setSaving(true)
    try {
      const updateData = { fullName: form.fullName, phone: form.phone }
      if (form.password) updateData.password = form.password
      const { data } = await usersApi.update(updateData)
      if (data?.success) {
        toast.success('Profil mis à jour')
        setProfile((prev) => ({ ...prev, ...form }))
        setForm({ ...form, password: '', confirmPassword: '' })
      } else {
        toast.error(data?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className={cn('rounded-2xl p-6 space-y-4 animate-pulse', cardCls)}>
          {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-xl bg-slate-800" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('rounded-2xl p-6 text-center', cardCls)}>
        <p className={cn('text-sm text-red-400')}>Erreur : {error}</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-xs text-blue-400 hover:underline cursor-pointer">
          Réessayer
        </button>
      </div>
    )
  }

  const roleBadge = (r) => {
    const styles = {
      SUPER_ADMIN: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      ADMIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      USER: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    }
    return styles[r] || styles.USER
  }

  const planBadge = (p) => {
    const styles = {
      PREMIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      PRO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      STANDARD: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    }
    return styles[p] || styles.STANDARD
  }

  return (
    <div className="space-y-5">
      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-2xl p-6 space-y-5', cardCls)}>
        <div className={cn('flex items-center gap-3 pb-4 border-b', isLight ? 'border-slate-100' : 'border-slate-800')}>
          <User className={cn('w-4 h-4', textMuted)} />
          <span className={cn('text-sm font-bold', textPrimary)}>Informations personnelles</span>
        </div>

        <div>
          <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Nom complet</label>
          <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            onFocus={() => setFieldFocused('name')} onBlur={() => setFieldFocused('')}
            className={inputCls(fieldFocused === 'name')} placeholder="Votre nom" />
        </div>

        <div>
          <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Email</label>
          <input value={form.email} readOnly
            onFocus={() => setFieldFocused('email')} onBlur={() => setFieldFocused('')}
            className={cn(inputCls(fieldFocused === 'email'), 'opacity-60 cursor-not-allowed')} />
          <p className={cn('text-[10px] mt-1', textMuted)}>L'email ne peut pas être modifié</p>
        </div>

        <div>
          <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Téléphone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            onFocus={() => setFieldFocused('phone')} onBlur={() => setFieldFocused('')}
            className={inputCls(fieldFocused === 'phone')} placeholder="+237 6XX XXX XXX" />
        </div>

        {/* Password */}
        <div>
          <div className={cn('flex items-center gap-3 pb-4 border-b', isLight ? 'border-slate-100' : 'border-slate-800')}>
            <Key className={cn('w-4 h-4', textMuted)} />
            <span className={cn('text-sm font-bold', textPrimary)}>Changer le mot de passe</span>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Nouveau mot de passe</label>
              <div className="relative">
                <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFieldFocused('password')} onBlur={() => { setFieldFocused(''); validateField('password', form.password) }}
                  type={showPassword ? 'text' : 'password'} className={cn(inputCls(fieldFocused === 'password'), 'pr-10')}
                  placeholder="8 caractères minimum" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="flex items-center gap-1 mt-1 text-[10px] text-red-400"><AlertCircle className="w-3 h-3" /> {formErrors.password}</p>
              )}
            </div>
            <div>
              <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>Confirmer le mot de passe</label>
              <div className="relative">
                <input value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  onFocus={() => setFieldFocused('confirmPassword')} onBlur={() => { setFieldFocused(''); validateField('confirmPassword', form.confirmPassword) }}
                  type={showConfirmPassword ? 'text' : 'password'} className={cn(inputCls(fieldFocused === 'confirmPassword'), 'pr-10')}
                  placeholder="Répétez le mot de passe" autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" tabIndex={-1}>
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="flex items-center gap-1 mt-1 text-[10px] text-red-400"><AlertCircle className="w-3 h-3" /> {formErrors.confirmPassword}</p>
              )}
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className={cn('flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50',
            isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </motion.div>

      {/* Account info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className={cn('rounded-2xl p-6 space-y-4', cardCls)}>
        <div className={cn('flex items-center gap-3 pb-4 border-b', isLight ? 'border-slate-100' : 'border-slate-800')}>
          <Shield className={cn('w-4 h-4', textMuted)} />
          <span className={cn('text-sm font-bold', textPrimary)}>Compte</span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'ID Utilisateur', value: profile?.userId || profile?.user_id || '—', mono: true },
            { label: 'Rôle', value: profile?.role, badge: roleBadge(profile?.role), icon: Shield },
            { label: 'Plan', value: profile?.planType || profile?.plan_type || 'STANDARD', badge: planBadge(profile?.planType || profile?.plan_type), icon: Crown },
            { label: 'Membre depuis', value: profile?.createdAt ? formatDateTime(profile.createdAt) : profile?.created_at ? formatDateTime(profile.created_at) : '—' },
            { label: 'Statut', value: (profile?.isActive !== false && profile?.is_active !== false) ? 'Actif' : 'Inactif', dot: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className={cn('text-xs', textSecondary)}>{row.label}</span>
              {row.badge ? (
                <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border', row.badge)}>
                  {row.icon && <row.icon className="w-3 h-3" />}
                  {row.value}
                </span>
              ) : row.dot ? (
                <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold',
                  (profile?.isActive !== false && profile?.is_active !== false) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', (profile?.isActive !== false && profile?.is_active !== false) ? 'bg-emerald-400' : 'bg-red-400')} />
                  {row.value}
                </span>
              ) : (
                <span className={cn('text-xs', row.mono ? 'font-mono font-medium' : '', textPrimary)}>{row.value}</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Plan info */}
      {planInfo && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={cn('rounded-2xl p-6 space-y-4', cardCls)}>
          <div className={cn('flex items-center gap-3 pb-4 border-b', isLight ? 'border-slate-100' : 'border-slate-800')}>
            <Wifi className={cn('w-4 h-4', textMuted)} />
            <span className={cn('text-sm font-bold', textPrimary)}>Utilisation du plan</span>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={cn('text-xs', textSecondary)}>Hotspots</span>
              <span className={cn('text-xs font-semibold', textPrimary)}>
                {planInfo.currentHotspots ?? planInfo.current_hotspots ?? 0} / {planInfo.maxHotspots ?? planInfo.max_hotspots ?? '∞'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((planInfo.currentHotspots ?? planInfo.current_hotspots ?? 0) / (planInfo.maxHotspots ?? 1)) * 100, 100)}%` }} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
