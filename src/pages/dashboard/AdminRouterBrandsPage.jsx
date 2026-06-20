/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Router, Plus, X, Edit3, Trash2, AlertCircle, CheckCircle, List } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { routerBrandAdminApi, routerModelAdminApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'
import EmptyState, { LoadingSkeleton, ErrorState } from '../../components/ui/EmptyState'
import ConfirmModal from '../../components/ui/ConfirmModal'

const initialForm = { name: '', slug: '', description: '', logoUrl: '', websiteUrl: '' }

export default function AdminRouterBrandsPage() {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const containerCls = isLight
    ? 'bg-white border border-slate-200 shadow-sm'
    : 'bg-slate-900/50 border border-slate-800 shadow-lg shadow-black/10'
  const btnPrimary = isLight
    ? 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-400'
    : 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500'

  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingBrand, setEditingBrand] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteSlug, setDeleteSlug] = useState(null)

  // ── Models modal ─────────────────────────────────────
  const [modelsBrand, setModelsBrand] = useState(null)      // brand whose models are shown
  const [modelsList, setModelsList] = useState([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [showModelForm, setShowModelForm] = useState(false)
  const [editingModel, setEditingModel] = useState(null)
  const [modelForm, setModelForm] = useState({ name: '', code: '' })
  const [modelFormErrors, setModelFormErrors] = useState({})
  const [modelSaving, setModelSaving] = useState(false)
  const [deleteModelSlug, setDeleteModelSlug] = useState(null)

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const res = await routerBrandAdminApi.list(false)
      setBrands(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur réseau')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchBrands() }, [fetchBrands])

  const slugify = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const validateForm = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Le nom est requis'
    if (!form.slug.trim()) errors.slug = 'Le slug est requis'
    else if (!/^[a-z0-9-]+$/.test(form.slug)) errors.slug = 'Slug invalide (lettres, chiffres, tirets)'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openNewForm = () => {
    setEditingBrand(null)
    setForm(initialForm)
    setFormErrors({})
    setShowForm(true)
  }

  const openEditForm = (brand) => {
    setEditingBrand(brand)
    setForm({
      name: brand.name || '',
      slug: brand.slug || '',
      description: brand.description || '',
      logoUrl: brand.logoUrl || brand.logo_url || '',
      websiteUrl: brand.websiteUrl || brand.website_url || ''
    })
    setFormErrors({})
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.slug) payload.slug = slugify(payload.name)

      if (editingBrand) {
        const slug = editingBrand.slug || payload.slug
        const res = await routerBrandAdminApi.update(slug, payload)
        if (res.status < 400) {
          toast.success('Marque modifiée', { icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> })
          setShowForm(false)
          fetchBrands()
        } else {
          toast.error(res?.data?.message || 'Erreur lors de la modification')
        }
      } else {
        const res = await routerBrandAdminApi.create(payload)
        if (res.status < 400) {
          toast.success('Marque créée', { icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> })
          setShowForm(false)
          fetchBrands()
        } else {
          toast.error(res?.data?.message || 'Erreur lors de la création')
        }
      }
    } catch {
      toast.error('Erreur de sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (brand) => {
    try {
      const res = await routerBrandAdminApi.toggleActive(brand.slug)
      if (res.status < 400) {
        setBrands((prev) =>
          prev.map((b) =>
            b.slug === brand.slug
              ? { ...b, isActive: !b.isActive, active: !b.active }
              : b
          )
        )
        const nowActive = brand.isActive || brand.active
        toast.success(nowActive ? 'Marque désactivée' : 'Marque activée')
      }
    } catch {
      toast.error('Erreur lors du changement de statut')
    }
  }

  const handleDelete = async () => {
    if (!deleteSlug) return
    try {
      const res = await routerBrandAdminApi.delete(deleteSlug)
      if (res.status < 400) {
        toast.success('Marque supprimée')
        setBrands((prev) => prev.filter((b) => b.slug !== deleteSlug))
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleteSlug(null)
    }
  }

  // ── Models CRUD ──────────────────────────────────────
  const fetchModels = useCallback(async (brandSlug) => {
    if (!brandSlug) return
    setModelsLoading(true)
    try {
      const res = await routerModelAdminApi.list(brandSlug)
      setModelsList(Array.isArray(res?.data) ? res.data : [])
    } catch {
      toast.error('Erreur de chargement des modèles')
      setModelsList([])
    } finally {
      setModelsLoading(false)
    }
  }, [])

  const openModels = (brand) => {
    setModelsBrand(brand)
    setShowModelForm(false)
    setEditingModel(null)
    setModelForm({ name: '', code: '' })
    setModelFormErrors({})
    setDeleteModelSlug(null)
    fetchModels(brand.slug)
  }

  const closeModels = () => {
    setModelsBrand(null)
    setModelsList([])
  }

  const openModelForm = (model) => {
    if (model) {
      setEditingModel(model)
      setModelForm({ name: model.name || '', code: model.code || '' })
    } else {
      setEditingModel(null)
      setModelForm({ name: '', code: '' })
    }
    setModelFormErrors({})
    setShowModelForm(true)
  }

  const handleModelSave = async () => {
    const errors = {}
    if (!modelForm.name.trim()) errors.name = 'Le nom est requis'
    if (!modelForm.code.trim()) errors.code = 'Le code est requis'
    setModelFormErrors(errors)
    if (Object.keys(errors).length) return

    if (!modelsBrand) return
    setModelSaving(true)
    try {
      const payload = { name: modelForm.name.trim(), code: modelForm.code.trim() }
      if (editingModel) {
        const res = await routerModelAdminApi.update(modelsBrand.slug, editingModel.id, payload)
        if (res.status < 400) {
          toast.success('Modèle modifié')
          setShowModelForm(false)
          fetchModels(modelsBrand.slug)
        }
      } else {
        const res = await routerModelAdminApi.create(modelsBrand.slug, payload)
        if (res.status < 400) {
          toast.success('Modèle créé')
          setShowModelForm(false)
          fetchModels(modelsBrand.slug)
        }
      }
    } catch {
      toast.error('Erreur de sauvegarde')
    } finally {
      setModelSaving(false)
    }
  }

  const handleModelToggle = async (model) => {
    if (!modelsBrand) return
    try {
      const res = await routerModelAdminApi.toggleActive(modelsBrand.slug, model.id)
      if (res.status < 400) {
        setModelsList((prev) =>
          prev.map((m) => m.id === model.id ? { ...m, active: !m.active, isActive: !m.isActive } : m)
        )
        toast.success(model.active || model.isActive ? 'Modèle désactivé' : 'Modèle activé')
      }
    } catch {
      toast.error('Erreur')
    }
  }

  const handleModelDelete = async () => {
    if (!deleteModelSlug || !modelsBrand) return
    try {
      const res = await routerModelAdminApi.delete(modelsBrand.slug, deleteModelSlug)
      if (res.status < 400) {
        toast.success('Modèle supprimé')
        setModelsList((prev) => prev.filter((m) => m.id !== deleteModelSlug))
      }
    } catch {
      toast.error('Erreur de suppression')
    } finally {
      setDeleteModelSlug(null)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-11 h-11 rounded-2xl bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-5 w-44 bg-slate-800 rounded-lg" />
            <div className="h-4 w-48 bg-slate-800 rounded-lg" />
          </div>
        </div>
        <LoadingSkeleton type="table" isLight={isLight} rows={4} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center',
            isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'
          )}>
            <Router className="w-5 h-5" />
          </div>
          <div>
            <h1 className={cn('text-xl font-bold tracking-tight', textPrimary)}>Marques de routeurs</h1>
            <p className={cn('text-xs', textSecondary)}>
              {brands.length} marque{brands.length !== 1 ? 's' : ''} enregistrée{brands.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={openNewForm}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500',
            btnPrimary
          )}
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Nouvelle marque
        </button>
      </div>

      {/* Error state */}
      {error && <ErrorState error={error} onRetry={fetchBrands} isLight={isLight} />}

      {/* Content */}
      {!error && (
        <>
          {brands.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn('rounded-2xl overflow-hidden', containerCls)}
            >
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                      <th className={cn('text-left px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px]', textMuted)}>Nom</th>
                      <th className={cn('text-left px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px] hidden md:table-cell', textMuted)}>Slug</th>
                      <th className={cn('text-left px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px] hidden lg:table-cell', textMuted)}>Description</th>
                      <th className={cn('text-center px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px]', textMuted)}>Modèles</th>
                      <th className={cn('text-center px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px]', textMuted)}>Actif</th>
                      <th className={cn('text-right px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px]', textMuted)}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {brands.map((b) => {
                      const isActive = b.isActive !== false && b.active !== false
                      return (
                        <tr
                          key={b.slug || b.id}
                          className={cn(
                            'transition-colors duration-150',
                            isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'
                          )}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold',
                                isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                              )}>
                                {b.name?.charAt(0) || '?'}
                              </div>
                              <span className={cn('font-semibold text-[11px]', textPrimary)}>{b.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden md:table-cell">
                            <code className={cn('text-[10px] font-mono px-1.5 py-0.5 rounded', isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400')}>
                              {b.slug || '—'}
                            </code>
                          </td>
                          <td className="px-5 py-3.5 hidden lg:table-cell">
                            <span className={cn('text-[10px] truncate max-w-55 block', textSecondary)}>
                              {b.description || '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={cn('text-xs font-semibold tabular-nums', textPrimary)}>
                              {b.modelCount ?? b.model_count ?? 0}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => handleToggle(b)}
                              className={cn(
                                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 cursor-pointer',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
                                isActive ? 'bg-emerald-500' : 'bg-slate-600'
                              )}
                              role="switch"
                              aria-checked={isActive}
                              aria-label={`${isActive ? 'Désactiver' : 'Activer'} ${b.name}`}
                            >
                              <span className={cn(
                                'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200',
                                isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                              )} />
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openModels(b)}
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
                                  isLight
                                    ? 'text-sky-400 hover:bg-sky-50 hover:text-sky-600'
                                    : 'text-sky-500 hover:bg-sky-500/10 hover:text-sky-400'
                                )}
                                aria-label={`Modèles de ${b.name}`}
                              >
                                <List className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditForm(b)}
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
                                  isLight
                                    ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                    : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                                )}
                                aria-label={`Modifier ${b.name}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteSlug(b.slug)}
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1',
                                  isLight
                                    ? 'text-red-400 hover:bg-red-50 hover:text-red-600'
                                    : 'text-red-500 hover:bg-red-500/10 hover:text-red-400'
                                )}
                                aria-label={`Supprimer ${b.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden p-3 space-y-2.5">
                {brands.map((b) => {
                  const isActive = b.isActive !== false && b.active !== false
                  const cardCls = isLight
                    ? 'bg-white border border-slate-200 shadow-sm'
                    : 'bg-slate-800/40 border border-slate-700/50'
                  return (
                    <div key={b.slug || b.id} className={cn('rounded-xl p-4', cardCls)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold',
                            isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                          )}>
                            {b.name?.charAt(0) || '?'}
                          </div>
                          <span className={cn('font-semibold text-xs', textPrimary)}>{b.name}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openModels(b)}
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer',
                              isLight ? 'text-sky-400 hover:bg-sky-50' : 'text-sky-500 hover:bg-sky-500/10'
                            )}
                            aria-label={`Modèles de ${b.name}`}
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditForm(b)}
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer',
                              isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-700'
                            )}
                            aria-label={`Modifier ${b.name}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteSlug(b.slug)}
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer',
                              isLight ? 'text-red-400 hover:bg-red-50' : 'text-red-500 hover:bg-red-500/10'
                            )}
                            aria-label={`Supprimer ${b.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <code className={cn('text-[10px] font-mono', textMuted)}>{b.slug}</code>
                      <div className="flex items-center justify-between mt-2">
                        <span className={cn('text-xs tabular-nums', textSecondary)}>
                          {b.modelCount ?? b.model_count ?? 0} modèle(s)
                        </span>
                        <button
                          onClick={() => handleToggle(b)}
                          className={cn(
                            'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 cursor-pointer',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                            isActive ? 'bg-emerald-500' : 'bg-slate-600'
                          )}
                          role="switch"
                          aria-checked={isActive}
                          aria-label={`${isActive ? 'Désactiver' : 'Activer'} ${b.name}`}
                        >
                          <span className={cn(
                            'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200',
                            isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                          )} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <EmptyState
              icon={Router}
              title="Aucune marque"
              message="Aucune marque de routeur pour le moment. Créez-en une avec le bouton ci-dessus."
              isLight={isLight}
            />
          )}
        </>
      )}

      {/* Brand form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={editingBrand ? 'Modifier la marque' : 'Nouvelle marque'}
              className={cn(
                'w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden',
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              )}
            >
              <div className={cn('flex items-center justify-between px-6 py-4 border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                <h2 className={cn('text-base font-bold', textPrimary)}>
                  {editingBrand ? 'Modifier' : 'Nouvelle'} marque
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-150 cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                    isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800'
                  )}
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Nom */}
                <div>
                  <label htmlFor="brand-name" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Nom <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="brand-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingBrand ? form.slug : slugify(e.target.value) })}
                    placeholder="MikroTik"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border',
                      'focus:ring-2 focus:ring-amber-500/40',
                      formErrors.name && 'border-red-500',
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800/50 border-slate-700 text-white'
                    )}
                    aria-invalid={!!formErrors.name}
                    aria-describedby={formErrors.name ? 'err-name' : undefined}
                  />
                  {formErrors.name && (
                    <p id="err-name" className="flex items-center gap-1 mt-1 text-[10px] text-red-400" role="alert">
                      <AlertCircle className="w-3 h-3" /> {formErrors.name}
                    </p>
                  )}
                </div>
                {/* Slug */}
                <div>
                  <label htmlFor="brand-slug" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Slug <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="brand-slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="mikrotik"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border font-mono',
                      'focus:ring-2 focus:ring-amber-500/40',
                      formErrors.slug && 'border-red-500',
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800/50 border-slate-700 text-white'
                    )}
                    aria-invalid={!!formErrors.slug}
                    aria-describedby={formErrors.slug ? 'err-slug' : undefined}
                  />
                  {formErrors.slug && (
                    <p id="err-slug" className="flex items-center gap-1 mt-1 text-[10px] text-red-400" role="alert">
                      <AlertCircle className="w-3 h-3" /> {formErrors.slug}
                    </p>
                  )}
                </div>
                {/* Description */}
                <div>
                  <label htmlFor="brand-desc" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Description
                  </label>
                  <textarea
                    id="brand-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Description optionnelle de la marque"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border resize-none',
                      'focus:ring-2 focus:ring-amber-500/40',
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800/50 border-slate-700 text-white'
                    )}
                  />
                </div>
                {/* Logo URL */}
                <div>
                  <label htmlFor="brand-logo" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Logo URL
                  </label>
                  <input
                    id="brand-logo"
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.svg"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border',
                      'focus:ring-2 focus:ring-amber-500/40',
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800/50 border-slate-700 text-white'
                    )}
                  />
                </div>
                {/* Site web */}
                <div>
                  <label htmlFor="brand-website" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Site web
                  </label>
                  <input
                    id="brand-website"
                    value={form.websiteUrl}
                    onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                    placeholder="https://mikrotik.com"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border',
                      'focus:ring-2 focus:ring-amber-500/40',
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800/50 border-slate-700 text-white'
                    )}
                  />
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    btnPrimary
                  )}
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sauvegarde…
                    </span>
                  ) : (
                    editingBrand ? 'Modifier' : 'Créer la marque'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Models Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {modelsBrand && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeModels}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Modèles ${modelsBrand.name}`}
              className={cn(
                'w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden',
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              )}
            >
              {/* Header */}
              <div className={cn('flex items-center justify-between px-6 py-4 border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold', isLight ? 'bg-sky-100 text-sky-600' : 'bg-sky-500/10 text-sky-400')}>
                    {modelsBrand.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h2 className={cn('text-sm font-bold', textPrimary)}>Modèles {modelsBrand.name}</h2>
                    <p className={cn('text-[10px]', textMuted)}>{modelsList.length} modèle{modelsList.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModelForm(null)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-sky-500 text-white hover:bg-sky-600 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Nouveau
                  </button>
                  <button
                    onClick={closeModels}
                    className={cn('w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer', isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800')}
                    aria-label="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 max-h-80 overflow-y-auto">
                {modelsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="animate-spin h-6 w-6 text-sky-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : modelsList.length > 0 ? (
                  <div className="space-y-1.5">
                    {modelsList.map((m) => {
                      const modelActive = m.active !== false && m.isActive !== false
                      return (
                        <div key={m.id} className={cn(
                          'flex items-center justify-between p-3 rounded-xl transition-colors',
                          isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30',
                        )}>
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold',
                              isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400',
                            )}>
                              {m.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className={cn('text-xs font-semibold', textPrimary)}>{m.name}</p>
                              <code className={cn('text-[10px] font-mono', textMuted)}>{m.code || '—'}</code>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleModelToggle(m)}
                              className={cn(
                                'relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 cursor-pointer',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
                                modelActive ? 'bg-emerald-500' : 'bg-slate-600'
                              )}
                              role="switch"
                              aria-checked={modelActive}
                              aria-label={`${modelActive ? 'Désactiver' : 'Activer'} ${m.name}`}
                            >
                              <span className={cn(
                                'inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200',
                                modelActive ? 'translate-x-4.5' : 'translate-x-0.5'
                              )} />
                            </button>
                            <button
                              onClick={() => openModelForm(m)}
                              className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer', isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-700')}
                              aria-label={`Modifier ${m.name}`}
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeleteModelSlug(m.id)}
                              className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer', isLight ? 'text-red-400 hover:bg-red-50' : 'text-red-500 hover:bg-red-500/10')}
                              aria-label={`Supprimer ${m.name}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Router className={cn('w-8 h-8 mb-2 opacity-30', textMuted)} aria-hidden="true" />
                    <p className={cn('text-xs font-semibold mb-1', textSecondary)}>Aucun modèle</p>
                    <p className={cn('text-[10px]', textMuted)}>Ajoutez un modèle avec le bouton ci-dessus.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Model form modal (sub-modal) ──────────────────── */}
      <AnimatePresence>
        {showModelForm && modelsBrand && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModelForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={editingModel ? 'Modifier le modèle' : 'Nouveau modèle'}
              className={cn(
                'w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden',
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              )}
            >
              <div className={cn('flex items-center justify-between px-5 py-3.5 border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                <h3 className={cn('text-sm font-bold', textPrimary)}>
                  {editingModel ? 'Modifier' : 'Nouveau'} modèle
                </h3>
                <button onClick={() => setShowModelForm(false)} className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer', isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800')} aria-label="Fermer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label htmlFor="model-name" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Nom <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="model-name"
                    value={modelForm.name}
                    onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                    placeholder="hAP ax3"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border',
                      'focus:ring-2 focus:ring-sky-500/40',
                      modelFormErrors.name && 'border-red-500',
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800/50 border-slate-700 text-white'
                    )}
                    aria-invalid={!!modelFormErrors.name}
                    aria-describedby={modelFormErrors.name ? 'err-model-name' : undefined}
                  />
                  {modelFormErrors.name && (
                    <p id="err-model-name" className="flex items-center gap-1 mt-1 text-[10px] text-red-400" role="alert">
                      <AlertCircle className="w-3 h-3" /> {modelFormErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="model-code" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="model-code"
                    value={modelForm.code}
                    onChange={(e) => setModelForm({ ...modelForm, code: e.target.value })}
                    placeholder="hAP-ax3"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border font-mono',
                      'focus:ring-2 focus:ring-sky-500/40',
                      modelFormErrors.code && 'border-red-500',
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800/50 border-slate-700 text-white'
                    )}
                    aria-invalid={!!modelFormErrors.code}
                    aria-describedby={modelFormErrors.code ? 'err-model-code' : undefined}
                  />
                  {modelFormErrors.code && (
                    <p id="err-model-code" className="flex items-center gap-1 mt-1 text-[10px] text-red-400" role="alert">
                      <AlertCircle className="w-3 h-3" /> {modelFormErrors.code}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleModelSave}
                  disabled={modelSaving}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-sky-500 text-white hover:bg-sky-600 transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500"
                >
                  {modelSaving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sauvegarde…
                    </span>
                  ) : (
                    editingModel ? 'Modifier' : 'Créer le modèle'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete model confirmation ────────────────────── */}
      <ConfirmModal
        open={!!deleteModelSlug}
        onClose={() => setDeleteModelSlug(null)}
        onConfirm={handleModelDelete}
        title="Supprimer le modèle"
        message="Ce modèle sera définitivement supprimé."
        confirmLabel="Supprimer"
        confirmClass={isLight
          ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400'
          : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
        }
      />

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteSlug}
        onClose={() => setDeleteSlug(null)}
        onConfirm={handleDelete}
        title="Supprimer la marque"
        message="Cette marque sera définitivement supprimée ainsi que tous ses modèles associés."
        confirmLabel="Supprimer"
        confirmClass={isLight
          ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400'
          : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
        }
      />
    </div>
  )
}
