import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pencil, X, MapPin, Globe, Server, User,
  Wifi, Tag, Smartphone, Save,
} from 'lucide-react'
import { routerApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'
import SearchableSelect from './SearchableSelect'

const FIELDS = [
  {
    group: 'Général',
    fields: [
      { key: 'name', label: 'Nom du hotspot', icon: Wifi, placeholder: 'Ex: Café Vietnam', required: true },
      { key: 'location', label: 'Localisation', icon: MapPin, placeholder: 'Ex: Douala, Cameroun' },
    ],
  },
  {
    group: 'Connexion routeur',
    fields: [
      { key: 'mikrotik_ip', label: 'Adresse IP', icon: Globe, placeholder: 'Ex: 192.168.88.1' },
      { key: 'mikrotik_port', label: 'Port', type: 'number', icon: Server, placeholder: '8728' },
      { key: 'mikrotik_user', label: 'Utilisateur', icon: User, placeholder: 'Ex: admin' },
    ],
  },
  {
    group: 'Configuration',
    fields: [
      { key: 'hotspot_profile', label: 'Profil hotspot', icon: Tag, placeholder: 'default' },
      { key: 'router_brand', label: 'Marque routeur', icon: Smartphone, isSelect: true },
      { key: 'router_type', label: 'Modèle routeur', icon: Smartphone, isSelect: true },
    ],
  },
]

export default function EditHotspotModal({ open, onClose, hotspot, onSave, saving = false }) {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'

  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [loadingBrands, setLoadingBrands] = useState(false)

  // Charger les marques
  useEffect(() => {
    if (!open) return
    ;(async () => {
      setLoadingBrands(true)
      try {
        const { data } = await routerApi.brands()
        setBrands(data?.data || data || [])
      } catch { /* silence */ }
      setLoadingBrands(false)
    })()
  }, [open])

  // Charger les modèles quand la marque change
  useEffect(() => {
    const brandSlug = form.router_brand
    if (!brandSlug) { setModels([]); return }
    ;(async () => {
      try {
        const { data } = await routerApi.models(brandSlug)
        setModels(data?.data || data || [])
      } catch { setModels([]) }
    })()
  }, [form.router_brand])

  // Initialiser le formulaire quand le hotspot change
  useEffect(() => {
    if (hotspot && open) {
      setForm({
        name: hotspot.name || '',
        location: hotspot.location || '',
        mikrotik_ip: hotspot.mikrotik_ip || '',
        mikrotik_port: hotspot.mikrotik_port?.toString() || '',
        mikrotik_user: hotspot.mikrotik_user || '',
        hotspot_profile: hotspot.hotspot_profile || '',
        router_brand: hotspot.router_brand || '',
        router_type: hotspot.router_type || '',
      })
      setErrors({})
    }
  }, [hotspot, open])

  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'router_brand') next.router_type = ''
      return next
    })
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }))
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name?.trim()) newErrors.name = 'Le nom est requis'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = { ...form }
    if (payload.mikrotik_port) payload.mikrotik_port = parseInt(payload.mikrotik_port, 10)
    else delete payload.mikrotik_port
    if (payload.router_type) {
      const match = models.find((m) => (m.slug || m.name?.toLowerCase().replace(/\s+/g, '-')) === payload.router_type)
      if (match?.id) payload.model_id = match.id
    }
    onSave(payload)
  }

  const inputBase = cn(
    'w-full h-11 pl-10 pr-4 text-sm outline-none transition-all duration-200 rounded-xl',
    isLight
      ? 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
      : 'bg-slate-800/60 border border-slate-700/60 text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15',
  )

  const inputError = 'border-red-400 focus:border-red-400 focus:ring-red-500/20'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.25 }}
            className={cn(
              'relative w-full max-w-xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden',
              isLight ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800',
            )}
          >
            <button
              onClick={onClose}
              className={cn(
                'absolute top-4 right-4 z-10 p-2 rounded-xl transition-all duration-200',
                isLight
                  ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                  : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300',
              )}
            >
              <X className="w-4 h-4" />
            </button>

            <div className={cn(
              'relative px-7 pt-7 pb-6 border-b',
              isLight ? 'border-slate-100' : 'border-slate-800',
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                  isLight ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10',
                )}>
                  <Pencil className={cn('w-5.5 h-5.5', isLight ? 'text-blue-600' : 'text-blue-400')} />
                </div>
                <div className="min-w-0">
                  <h2 className={cn('text-lg font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>
                    Modifier le hotspot
                  </h2>
                  <p className={cn('text-sm mt-0.5 truncate', isLight ? 'text-slate-500' : 'text-slate-400')}>
                    {hotspot?.name || 'Sans nom'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-7 py-5 space-y-6 overflow-y-auto max-h-[60vh]">
              {FIELDS.map(({ group, fields }) => (
                <div key={group}>
                  <h4 className={cn(
                    'text-[11px] font-semibold uppercase tracking-widest mb-3',
                    isLight ? 'text-slate-400' : 'text-slate-500',
                  )}>
                    {group}
                  </h4>
                  <div className="space-y-3">
                    {fields.map(({ key, type = 'text', label, icon: Icon, placeholder, required, isSelect }) => (
                      <div key={key}>
                        {isSelect ? (
                          key === 'router_brand' ? (
                            <div className="relative">
                              <div className={cn(
                                'absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none z-10',
                                isLight ? 'text-slate-400' : 'text-slate-500',
                              )}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="pl-11">
                                <SearchableSelect
                                  options={(brands || []).map((b) => ({
                                    value: b.slug || b.name?.toLowerCase().replace(/\s+/g, '-'),
                                    label: b.name,
                                  }))}
                                  value={form.router_brand || ''}
                                  onChange={(v) => handleChange('router_brand', v)}
                                  placeholder="Sélectionner une marque..."
                                  disabled={loadingBrands}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className={cn(
                                'absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none z-10',
                                isLight ? 'text-slate-400' : 'text-slate-500',
                              )}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="pl-11">
                                <SearchableSelect
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
                                />
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="relative">
                            <div className={cn(
                              'absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none transition-colors duration-200',
                              errors[key]
                                ? 'text-red-400'
                                : isLight ? 'text-slate-400' : 'text-slate-500',
                              form[key] && !errors[key] && (isLight ? 'text-blue-500' : 'text-blue-400'),
                            )}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <input
                              type={type}
                              value={form[key] ?? ''}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className={cn(inputBase, errors[key] && inputError)}
                              placeholder={placeholder || label}
                            />
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
              ))}
            </form>

            <div className={cn(
              'px-7 py-4 border-t flex items-center justify-end gap-3',
              isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-900/50',
            )}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className={cn(
                  'h-11 px-5 rounded-xl text-sm font-semibold transition-all duration-200',
                  isLight
                    ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700/50',
                  saving && 'opacity-50 cursor-not-allowed',
                )}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                onClick={handleSubmit}
                className={cn(
                  'h-11 px-5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2',
                  'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20',
                  'hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/30',
                  'active:scale-[0.98]',
                  saving && 'opacity-60 cursor-not-allowed active:scale-100',
                )}
              >
                <Save className={cn('w-4 h-4', saving && 'animate-pulse')} />
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
