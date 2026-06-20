/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, Wifi, MapPin, Globe, Server, Lock,
  User, Tag, Smartphone, Plus, RefreshCw, Eye, EyeOff,
} from 'lucide-react'
import { hotspotsApi, routerApi } from '../../api/endpoints'
import { makeHotspotSlug, storeSlugMapping } from '../../utils/slug'
import { cn } from '../../utils/cn'
import SearchableSelect from '../../components/ui/SearchableSelect'
import AuthLoader from '../../components/loader/AuthLoader'

const GROUPS = [
  {
    title: 'Général',
    fields: [
      { key: 'name', label: 'Nom du hotspot', icon: Wifi, placeholder: 'Ex: Café Vietnam', required: true },
      { key: 'location', label: 'Localisation', icon: MapPin, placeholder: 'Ex: Douala, Cameroun' },
    ],
  },
  {
    title: 'Connexion routeur',
    fields: [
      { key: 'mikrotik_ip', label: 'Adresse IP', icon: Globe, placeholder: 'Ex: 192.168.88.1', required: true },
      { key: 'mikrotik_port', label: 'Port', type: 'number', icon: Server, placeholder: '8728' },
      { key: 'mikrotik_user', label: 'Utilisateur', icon: User, placeholder: 'Ex: admin', required: true },
      { key: 'mikrotik_password', label: 'Mot de passe', type: 'password', icon: Lock, placeholder: 'Mot de passe MikroTik', required: true },
    ],
  },
  {
    title: 'Configuration',
    fields: [
      { key: 'hotspot_profile', label: 'Profil hotspot', icon: Tag, placeholder: 'default' },
      { key: 'router_brand', label: 'Marque routeur', icon: Smartphone, isSelect: true },
      { key: 'router_type', label: 'Modèle routeur', icon: Smartphone, isSelect: true },
    ],
  },
]

export default function NewHotspotPage() {
  const navigate = useNavigate()
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'

  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const userPlanType = useSelector((state) => state.auth.user?.planType || '').toLowerCase()
  const isStandard = userPlanType === 'standard'

  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [loadingBrands, setLoadingBrands] = useState(true)

  // Filtrer les marques selon le plan : Standard → MikroTik uniquement
  const availableBrands = isStandard
    ? (brands || []).filter((b) => b.name?.toLowerCase() === 'mikrotik')
    : (brands || [])

  useEffect(() => {
    (async () => {
      try {
        const { data } = await routerApi.brands()
        const list = data?.data || data || []
        setBrands(list)
      } catch { /* silence */ }
      setLoadingBrands(false)
    })()
  }, [])

  useEffect(() => {
    const brandSlug = form.router_brand
    if (!brandSlug) { setModels([]); return }
    ;(async () => {
      try {
        const { data } = await routerApi.models(brandSlug)
        const list = data?.data || data || []
        setModels(list)
      } catch { setModels([]) }
    })()
  }, [form.router_brand])

  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'

  const inputBase = cn(
    'w-full h-12 pl-11 pr-4 text-sm outline-none transition-all duration-200 rounded-xl',
    isLight
      ? 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
      : 'bg-slate-800/60 border border-slate-700/60 text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15',
  )
  const inputError = 'border-red-400 focus:border-red-400 focus:ring-red-500/20'

  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Réinitialiser le modèle quand la marque change
      if (key === 'router_brand') next.router_type = ''
      return next
    })
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name?.trim()) newErrors.name = 'Le nom est requis'
    if (!form.mikrotik_ip?.trim()) newErrors.mikrotik_ip = 'L\'adresse IP est requise'
    if (!form.mikrotik_user?.trim()) newErrors.mikrotik_user = 'Le nom d\'utilisateur est requis'
    if (!form.mikrotik_password?.trim()) newErrors.mikrotik_password = 'Le mot de passe est requis'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    // Convertir snake_case → camelCase pour l'API
    const toCamel = (str) => str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    const raw = { ...form }
    if (raw.mikrotik_port) raw.mikrotik_port = parseInt(raw.mikrotik_port, 10)
    else delete raw.mikrotik_port

    // Ajouter l'UUID du modèle si un modèle est sélectionné
    if (raw.router_type) {
      const match = models.find((m) => (m.slug || m.name?.toLowerCase().replace(/\s+/g, '-')) === raw.router_type)
      if (match?.id) raw.model_id = match.id
    }

    const payload = Object.fromEntries(
      Object.entries(raw).map(([key, val]) => [toCamel(key), val]),
    )

    setSubmitting(true)
    try {
      const { data } = await hotspotsApi.create(payload)
      if (data?.success) {
        const hotspot = data.data || data
        const hid = hotspot.hotspot_id || hotspot.id
        const slug = makeHotspotSlug(hotspot)
        if (slug) storeSlugMapping(slug, hid)
        toast.success('Hotspot créé avec succès')
        navigate(`/dashboard/hotspots/${slug}`, { replace: true })
      } else {
        toast.error(data?.message || 'Échec de la création')
      }
    } catch {
      toast.error('Erreur réseau lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* Halos d'ambiance */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-4 relative">
        <button
          onClick={() => navigate('/dashboard/hotspots')}
          className={cn(
            'p-2.5 rounded-xl transition-all shrink-0',
            isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400',
            'hover:scale-105 active:scale-95',
          )}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center',
            isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400',
          )}>
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h1 className={cn('text-2xl font-black tracking-tight', textPrimary)}>
              Nouveau hotspot
            </h1>
            <p className={cn('text-sm mt-0.5', textSecondary)}>
              Ajoutez un nouveau point d&apos;accès à votre réseau
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleSubmit}
        className={cn(
          'rounded-2xl p-6 sm:p-8 relative overflow-hidden',
          isLight
            ? 'bg-white border border-slate-200 shadow-sm'
            : 'bg-slate-900/50 border border-slate-800 shadow-xl shadow-black/10',
          submitting ? 'min-h-100 flex items-center justify-center' : 'space-y-8',
        )}
      >
        {submitting ? (
          <AuthLoader label="Création de votre hotspot..." />
        ) : (
          <>
        {/* Micro halo interne */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/2 rounded-full blur-[80px] pointer-events-none" />

        {GROUPS.map(({ title, fields }, i) => {
          const visibleFields = isStandard
            ? fields.filter((f) => f.key !== 'router_brand' && f.key !== 'router_type')
            : fields
          if (visibleFields.length === 0) return null
          return (
          <div key={title}>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                'w-0.5 h-4 rounded-full',
                i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-emerald-500' : 'bg-blue-500',
              )} />
              <h3 className={cn('text-[11px] font-bold uppercase tracking-widest', textPrimary)}>
                {title}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleFields.map(({ key, type = 'text', label, icon: Icon, placeholder, required, isSelect }) => (
                <div key={key}>
                  <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    {label}
                    {required && <span className="text-red-400 ml-0.5">*</span>}
                  </label>
                  {isSelect ? (
                    key === 'router_brand' ? (
                      <div className="relative">
                        <SearchableSelect
                          icon={<Icon className="w-4 h-4" />}
                          options={(availableBrands || []).map((b) => ({
                            value: b.slug || b.name?.toLowerCase().replace(/\s+/g, '-'),
                            label: b.name,
                          }))}
                          value={form.router_brand || ''}
                          onChange={(v) => handleChange('router_brand', v)}
                          placeholder="Sélectionner une marque..."
                          disabled={loadingBrands || availableBrands.length === 0}
                          error={!!errors.router_brand}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <SearchableSelect
                          icon={<Icon className="w-4 h-4" />}
                          options={(models || []).map((m) => ({
                            value: m.slug || m.name?.toLowerCase().replace(/\s+/g, '-'),
                            label: m.name,
                          }))}
                          value={form.router_type || ''}
                          onChange={(v) => handleChange('router_type', v)}
                          placeholder={
                            !form.router_brand
                              ? 'Sélectionnez d\'abord une marque'
                              : 'Sélectionner un modèle...'
                          }
                          disabled={!form.router_brand}
                          error={!!errors.router_type}
                        />
                      </div>
                    )
                  ) : (
                    <div className="relative">
                      <div
                        className={cn(
                          'absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none transition-colors duration-200',
                          errors[key]
                            ? 'text-red-400'
                            : isLight ? 'text-slate-400' : 'text-slate-500',
                          form[key] && !errors[key] && (isLight ? 'text-blue-500' : 'text-blue-400'),
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <input
                        type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                        value={form[key] ?? ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className={cn(
                          inputBase,
                          type === 'password' && 'pr-11',
                          errors[key] && inputError,
                        )}
                        placeholder={placeholder || label}
                      />
                      {type === 'password' && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={cn(
                            'absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center transition-colors',
                            isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300',
                          )}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  )}
                  {errors[key] && (
                    <p className="flex items-center gap-1 text-[11px] text-red-400 mt-1.5 ml-1">
                      <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                      {errors[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          )
        })}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/50">
          <button
            type="button"
            onClick={() => navigate('/dashboard/hotspots')}
            disabled={submitting}
            className={cn(
              'h-11 px-6 rounded-xl text-sm font-semibold transition-all duration-200',
              isLight
                ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700/50',
              submitting && 'opacity-50 cursor-not-allowed',
            )}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              'h-11 px-6 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2',
              'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20',
              'hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/30',
              'active:scale-[0.98]',
              submitting && 'opacity-60 cursor-not-allowed active:scale-100',
            )}
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {submitting ? 'Création...' : 'Créer le hotspot'}
          </button>
        </div>
          </>
        )}
      </motion.form>
    </div>
  )
}
