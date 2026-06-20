/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  Users, X, Edit3, Power, Shield, ShieldOff, User,
  AlertCircle, CheckCircle, Plus, RotateCcw, Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { adminUsersApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'
import { formatDateTime } from '../../utils/format'
import EmptyState, { LoadingSkeleton, ErrorState, NoSearchResults } from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import ConfirmModal from '../../components/ui/ConfirmModal'

const ROLE_OPTIONS = ['USER', 'ADMIN', 'SUPER_ADMIN']
const PLAN_OPTIONS = ['STANDARD', 'PRO', 'PREMIUM']

const roleBadge = (role) => {
  if (role === 'SUPER_ADMIN')
    return { cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Shield }
  if (role === 'ADMIN')
    return { cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: ShieldOff }
  return { cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: User }
}

export default function AdminUsersPage() {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const containerCls = isLight ? 'bg-white border border-slate-200 shadow-sm' : 'bg-slate-900/50 border border-slate-800 shadow-lg shadow-black/10'
  const btnPrimary = isLight ? 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400' : 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500'
  const inputCls = isLight
    ? 'bg-white border-slate-200 text-slate-900 focus:border-amber-400 placeholder:text-slate-400'
    : 'bg-slate-800 border-slate-700 text-white focus:border-amber-500 placeholder:text-slate-500'
  const selectCls = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-800 border-slate-700 text-white'

  const searchQuery = useSelector((state) => state.ui.searchQuery)

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const pageSize = 20

  // ── Filtres ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({ role: null, active: null, planType: null })
  const [showFilters, setShowFilters] = useState(false)
  const hasActiveFilters = filters.role || filters.active !== null || filters.planType

  // ── Modale création ──────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    fullName: '', email: '', password: '', phone: '', role: 'USER', planType: 'STANDARD', country: '',
  })
  const [createErrors, setCreateErrors] = useState({})
  const [creating, setCreating] = useState(false)

  // ── Modale édition ───────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '', role: 'USER', planType: 'STANDARD' })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // ── Modale toggle activation ─────────────────────────────────────────
  const [togglingUser, setTogglingUser] = useState(null) // { userId, fullName, currentActive }

  // ── Chargement ───────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const f = {}
      if (filters.active !== null) f.active = filters.active
      if (filters.role) f.role = filters.role
      if (filters.planType) f.planType = filters.planType

      const res = searchQuery
        ? await adminUsersApi.search(searchQuery, page, pageSize)
        : await adminUsersApi.list(page, pageSize, f)
      const data = res?.data?.data || {}
      setUsers(data.content || [])
      setTotalPages(data.totalPages || 0)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur réseau')
    } finally { setLoading(false) }
  }, [page, searchQuery, filters])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { setPage(0) }, [searchQuery, filters])

  const resetFilters = () => {
    setFilters({ role: null, active: null, planType: null })
  }

  // ── Validation ───────────────────────────────────────────────────────
  const validateEditForm = () => {
    const errors = {}
    if (!editForm.fullName.trim()) errors.fullName = 'Le nom est requis'
    if (!editForm.email.trim()) errors.email = "L'email est requis"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) errors.email = 'Email invalide'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateCreateForm = () => {
    const errors = {}
    if (!createForm.fullName.trim()) errors.fullName = 'Le nom est requis'
    if (!createForm.email.trim()) errors.email = "L'email est requis"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) errors.email = 'Email invalide'
    if (!createForm.password.trim()) errors.password = 'Le mot de passe est requis'
    else if (createForm.password.length < 8) errors.password = 'Au moins 8 caractères'
    setCreateErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ── Édition ──────────────────────────────────────────────────────────
  const openEdit = (u) => {
    setEditingUser(u)
    setEditForm({
      fullName: u.fullName || u.full_name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'USER',
      planType: u.planType || u.plan_type || 'STANDARD',
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!editingUser) return
    if (!validateEditForm()) return
    setSaving(true)
    try {
      const { data } = await adminUsersApi.update(editingUser.userId || editingUser.user_id, editForm)
      if (data?.success) {
        toast.success('Utilisateur mis à jour', { icon: <CheckCircle className="w-4 h-4 text-emerald-400" /> })
        setShowEditModal(false)
        fetchUsers()
      } else {
        toast.error(data?.message || 'Erreur lors de la mise à jour')
      }
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally { setSaving(false) }
  }

  // ── Création ─────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setCreateForm({ fullName: '', email: '', password: '', phone: '', role: 'USER', planType: 'STANDARD', country: '' })
    setCreateErrors({})
    setShowCreateModal(true)
  }

  const handleCreate = async () => {
    if (!validateCreateForm()) return
    setCreating(true)
    try {
      const payload = { ...createForm }
      if (!payload.phone) delete payload.phone
      if (!payload.country) delete payload.country
      const { data } = await adminUsersApi.create(payload)
      if (data?.success) {
        toast.success('Utilisateur créé avec succès')
        setShowCreateModal(false)
        fetchUsers()
      } else {
        toast.error(data?.message || "Erreur lors de la création")
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur réseau'
      toast.error(msg)
    } finally { setCreating(false) }
  }

  // ── Toggle activation/désactivation ──────────────────────────────────
  const handleToggleActive = async () => {
    if (!togglingUser) return
    const { userId, fullName, currentActive } = togglingUser
    const newActive = !currentActive
    try {
      const { data } = await adminUsersApi.update(userId, { isActive: newActive })
      if (data?.success) {
        toast.success(newActive ? `${fullName} réactivé` : `${fullName} désactivé`)
        setTogglingUser(null)
        fetchUsers()
      } else {
        toast.error(data?.message || 'Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    }
  }

  // ── Loading state ────────────────────────────────────────────────────
  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-11 h-11 rounded-2xl bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-5 w-36 bg-slate-800 rounded-lg" />
            <div className="h-4 w-48 bg-slate-800 rounded-lg" />
          </div>
        </div>
        <LoadingSkeleton type="table" isLight={isLight} rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header + Search + Nouvel utilisateur ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center',
            isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'
          )}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className={cn('text-xl font-bold tracking-tight', textPrimary)}>Utilisateurs</h1>
            <p className={cn('text-xs', textSecondary)}>Gestion des comptes utilisateurs</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {searchQuery && (
            <span className={cn('text-[10px] font-medium px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20')}>
              Recherche : <strong>"{searchQuery}"</strong>
            </span>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer border',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500',
              showFilters || hasActiveFilters
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800/50',
            )}
            aria-label="Filtres"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={openCreateModal}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500',
              btnPrimary
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nouvel utilisateur</span>
          </button>
        </div>
      </div>

      {/* ── Filtres ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn('overflow-hidden rounded-2xl border p-4', isLight
              ? 'bg-white border-slate-200'
              : 'bg-slate-900/30 border-slate-800')}
          >
            <div className="flex flex-wrap items-end gap-4">
              {/* Rôle */}
              <div className="flex-1 min-w-35">
                <label htmlFor="filter-role" className={cn('block text-[10px] font-semibold uppercase tracking-wide mb-1.5', textMuted)}>
                  Rôle
                </label>
                <select
                  id="filter-role"
                  value={filters.role || ''}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value || null })}
                  className={cn('w-full px-3 py-2 rounded-xl text-xs outline-none border cursor-pointer', selectCls)}
                >
                  <option value="">Tous les rôles</option>
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {/* Statut */}
              <div className="flex-1 min-w-30">
                <label htmlFor="filter-status" className={cn('block text-[10px] font-semibold uppercase tracking-wide mb-1.5', textMuted)}>
                  Statut
                </label>
                <select
                  id="filter-status"
                  value={filters.active === null ? '' : filters.active ? 'true' : 'false'}
                  onChange={(e) => {
                    const v = e.target.value
                    setFilters({ ...filters, active: v === '' ? null : v === 'true' })
                  }}
                  className={cn('w-full px-3 py-2 rounded-xl text-xs outline-none border cursor-pointer', selectCls)}
                >
                  <option value="">Tous</option>
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </select>
              </div>
              {/* Plan */}
              <div className="flex-1 min-w-32.5">
                <label htmlFor="filter-plan" className={cn('block text-[10px] font-semibold uppercase tracking-wide mb-1.5', textMuted)}>
                  Plan
                </label>
                <select
                  id="filter-plan"
                  value={filters.planType || ''}
                  onChange={(e) => setFilters({ ...filters, planType: e.target.value || null })}
                  className={cn('w-full px-3 py-2 rounded-xl text-xs outline-none border cursor-pointer', selectCls)}
                >
                  <option value="">Tous les plans</option>
                  {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {/* Reset */}
              <button
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer border',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                  isLight ? 'border-slate-200 text-slate-500 hover:bg-slate-100' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                )}
              >
                <RotateCcw className="w-3 h-3" />
                Réinitialiser
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error ────────────────────────────────────────────────────── */}
      {error && <ErrorState error={error} onRetry={fetchUsers} isLight={isLight} />}

      {/* ── Contenu ──────────────────────────────────────────────────── */}
      {!error && (
        <>
          {users.length > 0 ? (
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
                      <th className={cn('text-left px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px]', textMuted)}>Utilisateur</th>
                      <th className={cn('text-left px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px] hidden md:table-cell', textMuted)}>Email</th>
                      <th className={cn('text-center px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px]', textMuted)}>Rôle</th>
                      <th className={cn('text-center px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px] hidden md:table-cell', textMuted)}>Plan</th>
                      <th className={cn('text-center px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px]', textMuted)}>Statut</th>
                      <th className={cn('text-right px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px] hidden lg:table-cell', textMuted)}>Inscrit le</th>
                      <th className={cn('text-right px-5 py-3.5 font-semibold tracking-wide uppercase text-[10px]', textMuted)}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {users.map((u) => {
                      const isActive = u.isActive !== false && u.is_active !== false
                      const role = u.role || 'USER'
                      const badge = roleBadge(role, isLight)
                      const Icon = badge.icon
                      const userId = u.userId || u.user_id
                      return (
                        <tr
                          key={userId}
                          className={cn(
                            'transition-colors duration-150',
                            isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'
                          )}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                'w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs',
                                isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                              )}>
                                {(u.fullName || u.full_name || '?').charAt(0)}
                              </div>
                              <div>
                                <p className={cn('font-semibold text-[11px]', textPrimary)}>
                                  {u.fullName || u.full_name || '—'}
                                </p>
                                {u.phone && (
                                  <p className={cn('text-[10px]', textMuted)}>{u.phone}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className={cn('px-5 py-3.5 text-[11px] hidden md:table-cell', textSecondary)}>
                            {u.email || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                              badge.cls
                            )}>
                              <Icon className="w-3 h-3" aria-hidden="true" />
                              {role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center hidden md:table-cell">
                            <span className={cn('text-[11px] font-medium', textSecondary)}>
                              {u.planType || u.plan_type || 'STANDARD'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            )}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-emerald-400' : 'bg-red-400')} />
                              {isActive ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                            <span className={cn('text-[11px]', textSecondary)}>
                              {u.createdAt ? formatDateTime(u.createdAt) : u.created_at ? formatDateTime(u.created_at) : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEdit(u)}
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
                                  isLight
                                    ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                    : 'text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                                )}
                                aria-label={`Modifier ${u.fullName || u.full_name || 'l\'utilisateur'}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setTogglingUser({
                                  userId,
                                  fullName: u.fullName || u.full_name || 'Utilisateur',
                                  currentActive: isActive,
                                })}
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer',
                                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                                  isActive
                                    ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-400 focus-visible:ring-red-500'
                                    : 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 focus-visible:ring-emerald-500'
                                )}
                                aria-label={isActive
                                  ? `Désactiver ${u.fullName || u.full_name || 'l\'utilisateur'}`
                                  : `Activer ${u.fullName || u.full_name || 'l\'utilisateur'}`
                                }
                              >
                                <Power className="w-3.5 h-3.5" />
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
                {users.map((u) => {
                  const isActive = u.isActive !== false && u.is_active !== false
                  const role = u.role || 'USER'
                  const badge = roleBadge(role, isLight)
                  const Icon = badge.icon
                  const userId = u.userId || u.user_id
                  const cardCls = isLight
                    ? 'bg-white border border-slate-200 shadow-sm'
                    : 'bg-slate-800/40 border border-slate-700/50'
                  return (
                    <div key={userId} className={cn('rounded-xl p-4', cardCls)}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs',
                            isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                          )}>
                            {(u.fullName || u.full_name || '?').charAt(0)}
                          </div>
                          <div>
                            <p className={cn('font-semibold text-xs', textPrimary)}>
                              {u.fullName || u.full_name || '—'}
                            </p>
                            <p className={cn('text-[10px]', textMuted)}>{u.email || '—'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEdit(u)}
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150',
                              isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-700'
                            )}
                            aria-label={`Modifier ${u.fullName || u.full_name || 'l\'utilisateur'}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTogglingUser({
                              userId,
                              fullName: u.fullName || u.full_name || 'Utilisateur',
                              currentActive: isActive,
                            })}
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150',
                              isActive
                                ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'
                                : 'text-emerald-400 hover:bg-emerald-500/10'
                            )}
                            aria-label={isActive
                              ? `Désactiver ${u.fullName || u.full_name || 'l\'utilisateur'}`
                              : `Activer ${u.fullName || u.full_name || 'l\'utilisateur'}`
                            }
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', badge.cls)}>
                          <Icon className="w-3 h-3" aria-hidden="true" />
                          {role}
                        </span>
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                          isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-emerald-400' : 'bg-red-400')} />
                          {isActive ? 'Actif' : 'Inactif'}
                        </span>
                        <span className={cn('text-[10px]', textMuted)}>
                          {u.planType || u.plan_type || 'STANDARD'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Pagination page={page} totalPages={totalPages} onChange={setPage} isLight={isLight} />
            </motion.div>
          ) : (
            searchQuery
              ? <NoSearchResults query={searchQuery} isLight={isLight} />
              : <EmptyState icon={Users} title="Aucun utilisateur" message="Aucun utilisateur trouvé." isLight={isLight} />
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         MODALE : NOUVEL UTILISATEUR
         ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Nouvel utilisateur"
              className={cn(
                'w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden',
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              )}
            >
              <div className={cn('flex items-center justify-between px-6 py-4 border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                <h2 className={cn('text-base font-bold', textPrimary)}>Nouvel utilisateur</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
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
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Nom */}
                <div>
                  <label htmlFor="create-fullname" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Nom complet <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="create-fullname"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    placeholder="Jean Dupont"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border',
                      'focus:ring-2 focus:ring-amber-500/40',
                      createErrors.fullName && 'border-red-500',
                      inputCls
                    )}
                    aria-invalid={!!createErrors.fullName}
                    aria-describedby={createErrors.fullName ? 'err-create-fullname' : undefined}
                  />
                  {createErrors.fullName && (
                    <p id="err-create-fullname" className="flex items-center gap-1 mt-1 text-[10px] text-red-400" role="alert">
                      <AlertCircle className="w-3 h-3" /> {createErrors.fullName}
                    </p>
                  )}
                </div>
                {/* Email */}
                <div>
                  <label htmlFor="create-email" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="jean@example.com"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border',
                      'focus:ring-2 focus:ring-amber-500/40',
                      createErrors.email && 'border-red-500',
                      inputCls
                    )}
                    aria-invalid={!!createErrors.email}
                    aria-describedby={createErrors.email ? 'err-create-email' : undefined}
                  />
                  {createErrors.email && (
                    <p id="err-create-email" className="flex items-center gap-1 mt-1 text-[10px] text-red-400" role="alert">
                      <AlertCircle className="w-3 h-3" /> {createErrors.email}
                    </p>
                  )}
                </div>
                {/* Mot de passe */}
                <div>
                  <label htmlFor="create-password" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Mot de passe <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="create-password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Min. 8 caractères"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border',
                      'focus:ring-2 focus:ring-amber-500/40',
                      createErrors.password && 'border-red-500',
                      inputCls
                    )}
                    aria-invalid={!!createErrors.password}
                    aria-describedby={createErrors.password ? 'err-create-password' : undefined}
                  />
                  {createErrors.password && (
                    <p id="err-create-password" className="flex items-center gap-1 mt-1 text-[10px] text-red-400" role="alert">
                      <AlertCircle className="w-3 h-3" /> {createErrors.password}
                    </p>
                  )}
                </div>
                {/* Téléphone */}
                <div>
                  <label htmlFor="create-phone" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Téléphone
                  </label>
                  <input
                    id="create-phone"
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+221 77 123 45 67"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border', 'focus:ring-2 focus:ring-amber-500/40',
                      inputCls
                    )}
                  />
                </div>
                {/* Pays */}
                <div>
                  <label htmlFor="create-country" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Pays
                  </label>
                  <input
                    id="create-country"
                    value={createForm.country}
                    onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                    placeholder="SN"
                    maxLength={5}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border', 'focus:ring-2 focus:ring-amber-500/40',
                      inputCls
                    )}
                  />
                </div>
                {/* Rôle + Plan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="create-role" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                      Rôle
                    </label>
                    <select
                      id="create-role"
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border cursor-pointer',
                        'focus:ring-2 focus:ring-amber-500/40', selectCls
                      )}
                    >
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="create-plan" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                      Plan
                    </label>
                    <select
                      id="create-plan"
                      value={createForm.planType}
                      onChange={(e) => setCreateForm({ ...createForm, planType: e.target.value })}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border cursor-pointer',
                        'focus:ring-2 focus:ring-amber-500/40', selectCls
                      )}
                    >
                      {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    btnPrimary
                  )}
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Création…
                    </span>
                  ) : 'Créer l\'utilisateur'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
         MODALE : MODIFIER
         ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showEditModal && editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Modifier l'utilisateur"
              className={cn(
                'w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden',
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              )}
            >
              <div className={cn('flex items-center justify-between px-6 py-4 border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
                <h2 className={cn('text-base font-bold', textPrimary)}>Modifier l'utilisateur</h2>
                <button
                  onClick={() => setShowEditModal(false)}
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
                  <label htmlFor="edit-fullname" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Nom complet <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="edit-fullname"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border',
                      'focus:ring-2 focus:ring-amber-500/40',
                      formErrors.fullName && 'border-red-500',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-800/50 border-slate-700 text-white'
                    )}
                    aria-invalid={!!formErrors.fullName}
                    aria-describedby={formErrors.fullName ? 'err-fullname' : undefined}
                  />
                  {formErrors.fullName && (
                    <p id="err-fullname" className="flex items-center gap-1 mt-1 text-[10px] text-red-400" role="alert">
                      <AlertCircle className="w-3 h-3" /> {formErrors.fullName}
                    </p>
                  )}
                </div>
                {/* Email */}
                <div>
                  <label htmlFor="edit-email" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border',
                      'focus:ring-2 focus:ring-amber-500/40',
                      formErrors.email && 'border-red-500',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-800/50 border-slate-700 text-white'
                    )}
                    aria-invalid={!!formErrors.email}
                    aria-describedby={formErrors.email ? 'err-email' : undefined}
                  />
                  {formErrors.email && (
                    <p id="err-email" className="flex items-center gap-1 mt-1 text-[10px] text-red-400" role="alert">
                      <AlertCircle className="w-3 h-3" /> {formErrors.email}
                    </p>
                  )}
                </div>
                {/* Téléphone */}
                <div>
                  <label htmlFor="edit-phone" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Téléphone
                  </label>
                  <input
                    id="edit-phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border',
                      'focus:ring-2 focus:ring-amber-500/40',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-slate-800/50 border-slate-700 text-white'
                    )}
                  />
                </div>
                {/* Rôle + Plan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-role" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                      Rôle
                    </label>
                    <select
                      id="edit-role"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border cursor-pointer',
                        'focus:ring-2 focus:ring-amber-500/40',
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800/50 border-slate-700 text-white'
                      )}
                    >
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-plan" className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                      Plan
                    </label>
                    <select
                      id="edit-plan"
                      value={editForm.planType}
                      onChange={(e) => setEditForm({ ...editForm, planType: e.target.value })}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all border cursor-pointer',
                        'focus:ring-2 focus:ring-amber-500/40',
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800/50 border-slate-700 text-white'
                      )}
                    >
                      {PLAN_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
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
                  ) : 'Enregistrer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmation activation/désactivation ────────────────────── */}
      <ConfirmModal
        open={!!togglingUser}
        onClose={() => setTogglingUser(null)}
        onConfirm={handleToggleActive}
        title={togglingUser?.currentActive ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
        message={togglingUser?.currentActive
          ? `${togglingUser?.fullName || "L'utilisateur"} sera désactivé et ne pourra plus se connecter.`
          : `${togglingUser?.fullName || "L'utilisateur"} sera réactivé et pourra à nouveau se connecter.`
        }
        confirmLabel={togglingUser?.currentActive ? 'Désactiver' : 'Activer'}
        confirmClass={togglingUser?.currentActive ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'}
      />
    </div>
  )
}
