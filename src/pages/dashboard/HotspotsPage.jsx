/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/preserve-manual-memoization */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {  Wifi } from 'lucide-react'
import { hotspotsApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { timeAgo } from '../../utils/format'
import { cn } from '../../utils/cn'
import { makeHotspotSlug, storeSlugMapping } from '../../utils/slug'
import ConfirmModal from '../../components/ui/ConfirmModal'
import EmptyState, { LoadingSkeleton, ErrorState, NoSearchResults } from '../../components/ui/EmptyState'
import {
  HotspotsHeader, HotspotsBulkBar, HotspotsTable, HotspotsCardGrid,
} from '../../components/hotspots'

const ROWS_PER_PAGE = 10
const PLAN_LEVEL = { STANDARD: 0, PRO: 1, PREMIUM: 2 }

export default function HotspotsPage() {
  const navigate = useNavigate()
  const theme = useSelector((state) => state.ui.theme)
  const searchQuery = useSelector((state) => state.ui.searchQuery)
  const { user, role } = useAuth()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const planLevel = PLAN_LEVEL[user?.planType || 'STANDARD'] ?? 0

  const [hotspots, setHotspots] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(totalElements / ROWS_PER_PAGE))
  const [scope, setScope] = useState('global')
  const [viewMode, setViewMode] = useState('list')
  const [statusFilter, setStatusFilter] = useState('')
  const [testingId, setTestingId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const hasDataRef = useRef(false)
  const isLight = theme === 'light'
  const containerCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'

  const getHotspotId = (h) => h.hotspot_id ?? h.id

  const goToHotspot = useCallback((h) => {
    const hid = getHotspotId(h)
    const slug = makeHotspotSlug(h)
    if (slug) storeSlugMapping(slug, hid)
    navigate(`/dashboard/hotspots/${slug}`)
  }, [navigate])

  // Reset page au changement de scope
  const prevScopeKey = useRef('')
  useEffect(() => {
    if (prevScopeKey.current && prevScopeKey.current !== scope) setPage(0)
    prevScopeKey.current = scope
  }, [scope])
  useEffect(() => { setSelectedIds(new Set()) }, [page])

  // Filtrage
  const filteredHotspots = useMemo(() => {
    let list = hotspots
    const q = searchQuery?.toLowerCase()
    if (q) list = list.filter((h) =>
      (h.name || '').toLowerCase().includes(q) ||
      (h.mikrotik_ip || '').toLowerCase().includes(q) ||
      (h.location || '').toLowerCase().includes(q)
    )
    if (statusFilter) list = list.filter((h) => (h.status || 'NO_TOKEN') === statusFilter)
    return list
  }, [hotspots, searchQuery, statusFilter])

  const allFilteredSelected = filteredHotspots.length > 0 &&
    filteredHotspots.every((h) => selectedIds.has(getHotspotId(h)))

  // Fetch
  const fetchHotspots = useCallback(async () => {
    try {
      if (!hasDataRef.current) setLoading(true); else setRefreshing(true)
      setError(null)
      const uid = user?.userId || ''
      const isGlobal = isAdmin && scope === 'global'
      const res = await (isGlobal
        ? hotspotsApi.adminList(page, ROWS_PER_PAGE)
        : hotspotsApi.list(uid, page, ROWS_PER_PAGE, 'self'))
      if (res?.data?.success) {
        const data = res.data.data
        const list = data?.content || data || []
        setHotspots(Array.isArray(list) ? list : [])
        setTotalElements(data?.page?.totalElements ?? data?.totalElements ?? list.length)
        if (list.length > 0) hasDataRef.current = true
      } else if (res?.data?.data?.content) {
        const data = res.data.data
        setHotspots(data.content)
        setTotalElements(data?.page?.totalElements ?? data.totalElements ?? data.content.length)
        if (data.content?.length > 0) hasDataRef.current = true
      } else { setHotspots([]); setTotalElements(0) }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Erreur réseau'
      setError(msg); toast.error(msg, { duration: 5000 })
    } finally { setLoading(false); setRefreshing(false) }
  }, [user?.userId, page, scope, isAdmin])
  useEffect(() => { fetchHotspots() }, [fetchHotspots])

  // Actions
  const toggleSelect = (id) => setSelectedIds((p) => {
    const n = new Set(p); return n.has(id) ? (n.delete(id), n) : (n.add(id), n)
  })
  const toggleSelectAll = () => allFilteredSelected
    ? setSelectedIds(new Set())
    : setSelectedIds(new Set(filteredHotspots.map(getHotspotId)))

  const handleInlineTest = async (hid, e) => {
    e.stopPropagation(); setTestingId(hid)
    try {
      const { data } = await hotspotsApi.test(hid)
      if (data?.success) toast.success('Connexion réussie')
      else toast.error(data?.message || 'Échec du test')
    } catch { toast.error('Échec du test') }
    finally { setTestingId(null) }
  }

  const exportCSV = () => {
    const rows = filteredHotspots.map((h) => ({
      Nom: h.name || '',
      IP: h.mikrotik_ip || '',
      Localisation: h.location || '',
      Marque: h.router_brand || '',
      Statut: h.status || '',
      Token: h.router_token_configured ? 'Oui' : 'Non',
      'Dernier ping': h.last_ping_at ? timeAgo(h.last_ping_at) : 'Jamais',
      'Date création': h.created_at || '',
    }))
    const headers = Object.keys(rows[0] || {})
    if (!headers.length) { toast.error('Aucune donnée à exporter'); return }
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => `"${(r[h] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `hotspots_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url); toast.success('Export CSV terminé')
  }

  const handleConfirmDelete = async () => {
    setShowConfirm(false); setDeleting(true)
    const ids = [...selectedIds]
    const results = await Promise.allSettled(ids.map((id) => hotspotsApi.delete(id)))
    const ok = results.filter((r) => r.status === 'fulfilled').length
    const fail = results.filter((r) => r.status === 'rejected').length
    if (ok > 0) toast.success(`${ok} hotspot${ok !== 1 ? 's' : ''} supprimé${ok !== 1 ? 's' : ''}`)
    if (fail > 0) toast.error(`${fail} suppression${fail !== 1 ? 's' : ''} ont échoué`)
    setSelectedIds(new Set()); setDeleting(false); fetchHotspots()
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════════

  if (loading) return <LoadingSkeleton type="table" isLight={isLight} rows={5} />

  if (error) return <ErrorState error={error} onRetry={fetchHotspots} isLight={isLight} />

  if (!loading && !error && hotspots.length === 0) {
    return (
      <EmptyState
        icon={Wifi}
        title={isAdmin ? 'Aucun hotspot sur la plateforme' : 'Créez votre premier hotspot WiFi'}
        message={isAdmin
          ? "Encore aucun hotspot créé. Les hotspots apparaîtront ici dès qu'un utilisateur en configurera un."
          : "Vous n'avez pas encore de hotspot. Lancez-vous en créant votre premier point d'accès WiFi — générez des revenus en quelques minutes."
        }
        action={!isAdmin ? { label: 'Créer mon premier hotspot', onClick: () => navigate('/onboarding') } : null}
        isLight={isLight}
      />
    )
  }

  return (
    <div className="space-y-4">
      <HotspotsHeader
        isLight={isLight}
        title={isAdmin && scope === 'global' ? 'Tous les hotspots' : 'Mes hotspots'}
        filteredCount={filteredHotspots.length}
        totalElements={totalElements}
        isAdmin={isAdmin}
        scope={scope}
        onScopeChange={setScope}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        planLevel={planLevel}
        onExport={exportCSV}
        refreshing={refreshing}
        onRefresh={fetchHotspots}
        onAdd={() => navigate('/dashboard/hotspots/new')}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {selectedIds.size > 0 && (
          <HotspotsBulkBar
            isLight={isLight}
            selectedCount={selectedIds.size}
            deleting={deleting}
            onDelete={() => setShowConfirm(true)}
            onClear={() => setSelectedIds(new Set())}
          />
        )}

        {filteredHotspots.length === 0 ? (
          <div className={cn('rounded-2xl overflow-hidden', containerCls)}>
            <NoSearchResults query={searchQuery} isLight={isLight} />
          </div>
        ) : viewMode === 'list' ? (
          <HotspotsTable
            hotspots={filteredHotspots}
            isLight={isLight}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            allFilteredSelected={allFilteredSelected}
            onToggleSelectAll={toggleSelectAll}
            getHotspotId={getHotspotId}
            onDetail={goToHotspot}
            planLevel={planLevel}
            testingId={testingId}
            onTest={handleInlineTest}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        ) : (
          <HotspotsCardGrid
            hotspots={filteredHotspots}
            isLight={isLight}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            allFilteredSelected={allFilteredSelected}
            onToggleSelectAll={toggleSelectAll}
            getHotspotId={getHotspotId}
            onDetail={goToHotspot}
            planLevel={planLevel}
            testingId={testingId}
            onTest={handleInlineTest}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </motion.div>

      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message={selectedIds.size === 1
          ? 'Êtes-vous sûr de vouloir supprimer ce hotspot ? Cette action est irréversible.'
          : `Êtes-vous sûr de vouloir supprimer ces ${selectedIds.size} hotspots ? Cette action est irréversible.`
        }
        confirmLabel="Supprimer"
        loading={deleting}
        delay={3}
      />
    </div>
  )
}
