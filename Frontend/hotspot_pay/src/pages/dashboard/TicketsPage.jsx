import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useSelector } from 'react-redux'
import { Plus, Search, Ticket } from 'lucide-react'
import { motion } from 'framer-motion'
import { ticketsApi, hotspotsApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { usePlan } from '../../hooks/usePlan'
import { formatDateTime } from '../../utils/format'
import { cn } from '../../utils/cn'
import ConfirmModal from '../../components/ui/ConfirmModal'
import ScopeToggle from '../../components/ui/ScopeToggle'
import EmptyState, { LoadingSkeleton, ErrorState, NoSearchResults } from '../../components/ui/EmptyState'
import {
  HotspotGrid, TicketsHeader, TicketsActionsBar,
  BulkActionsBar, TicketsTable, TicketsMobileCards, UpgradeBanner,
} from '../../components/tickets'

export default function TicketsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const theme = useSelector((state) => state.ui.theme)
  const globalSearch = useSelector((state) => state.ui.searchQuery)
  const { user, role } = useAuth()
  const { showExport, isProOrAbove, needsUpgrade } = usePlan()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const canBulkManage = isAdmin || isProOrAbove
  const uid = user?.userId || ''
  const isLight = theme === 'light'

  const preselectedHotspotId = searchParams.get('hotspotId') || ''

  // Scope
  const [scope, setScope] = useState(isAdmin ? 'global' : 'self')

  // Hotspots
  const [hotspots, setHotspots] = useState([])
  const [loadingHotspots, setLoadingHotspots] = useState(true)
  const [selectedHotspotId, setSelectedHotspotId] = useState(preselectedHotspotId)

  // Tickets
  const [tickets, setTickets] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // Filtres
  const [statusFilter, setStatusFilter] = useState('')

  // Sélection
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Confirmations
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [individualRevokeTicket, setIndividualRevokeTicket] = useState(null)
  const [individualDeleteTicket, setIndividualDeleteTicket] = useState(null)
  const [processing, setProcessing] = useState(false)

  // Password reveal
  const [revealedIds, setRevealedIds] = useState(new Set())

  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const cardCls = isLight
    ? 'bg-white border border-slate-200 shadow-sm'
    : 'bg-slate-900/50 border border-slate-800 shadow-xl shadow-black/10'
  const inputBase = cn(
    'w-full text-sm outline-none transition-all duration-200 rounded-xl',
    isLight
      ? 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
      : 'bg-slate-800/60 border border-slate-700/60 text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15',
  )

  // ── Charger les hotspots ──────────────────────────────────────────
  const initialPreselectedRef = useRef(preselectedHotspotId)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingHotspots(true)
        const isGlobal = isAdmin && scope === 'global'
        const res = await (isGlobal
          ? hotspotsApi.adminList(0, 100)
          : hotspotsApi.list(uid, 0, 100, 'self'))
        if (cancelled) return
        const list = res?.data?.data?.content || res?.data?.data || []
        setHotspots(Array.isArray(list) ? list : [])
        if (!initialPreselectedRef.current && Array.isArray(list) && list.length === 1) {
          setSelectedHotspotId(list[0].hotspot_id || list[0].id)
        }
      } catch { /* silencieux */ }
      finally { if (!cancelled) setLoadingHotspots(false) }
    })()
    return () => { cancelled = true }
  }, [uid, isAdmin, scope])

  // Reset hotspotId au changement de scope
  const prevScopeRef = useRef(scope)
  useEffect(() => {
    if (prevScopeRef.current && prevScopeRef.current !== scope) {
      setSelectedHotspotId('')
      setSearchParams({})
    }
    prevScopeRef.current = scope
  }, [scope, setSearchParams])

  // ── Charger les tickets ───────────────────────────────────────────
  const hasTicketsRef = useRef(false)
  const prevHotspotRef = useRef('')
  const [refreshKey, setRefreshKey] = useState(0)
  const fetchTickets = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    if (!selectedHotspotId) return
    let cancelled = false
    if (prevHotspotRef.current !== selectedHotspotId) {
      hasTicketsRef.current = false
      prevHotspotRef.current = selectedHotspotId
    }
    ;(async () => {
      try {
        if (!hasTicketsRef.current) setLoading(true); else setRefreshing(true)
        setError(null)
        const res = await ticketsApi.list(selectedHotspotId)
        if (cancelled) return
        if (res?.data?.success) {
          const data = res.data.data
          const list = data?.tickets || []
          setTickets(Array.isArray(list) ? list : [])
          setTotalElements(data?.total || list.length)
          if (Array.isArray(list) && list.length > 0) hasTicketsRef.current = true
        } else { setTickets([]); setTotalElements(0) }
      } catch (err) {
        if (cancelled) return
        setError(err.response?.data?.message || err.message || 'Erreur réseau')
      } finally {
        if (!cancelled) { setLoading(false); setRefreshing(false) }
      }
    })()
    return () => { cancelled = true }
  }, [selectedHotspotId, refreshKey])
  useEffect(() => { setSelectedIds(new Set()) }, [selectedHotspotId])

  // ── Filtrage ──────────────────────────────────────────────────────
  const filteredTickets = useMemo(() => {
    let list = tickets
    const q = (globalSearch || '').toLowerCase()
    if (q) list = list.filter((t) => (t.username || '').toLowerCase().includes(q))
    if (statusFilter) list = list.filter((t) => (t.status || '') === statusFilter)
    return list
  }, [tickets, globalSearch, statusFilter])

  const allChecked = filteredTickets.length > 0 &&
    filteredTickets.every((t) => selectedIds.has(t.ticket_id || t.id))
  const toggleSelect = (id) => setSelectedIds((p) => {
    const n = new Set(p); return n.has(id) ? (n.delete(id), n) : (n.add(id), n)
  })
  const toggleSelectAll = () => allChecked
    ? setSelectedIds(new Set())
    : setSelectedIds(new Set(filteredTickets.map((t) => t.ticket_id || t.id)))

  // ── Révoquer / Supprimer (individuel) ──────────────────────────────
  const handleIndividualDelete = async () => {
    const tid = individualDeleteTicket
    if (!tid) return
    setIndividualDeleteTicket(null); setProcessing(true)
    try {
      await ticketsApi.delete(selectedHotspotId, tid)
      const t = tickets.find((x) => (x.ticket_id || x.id) === tid)
      toast.success(`Ticket ${t?.username || tid} supprimé`)
      fetchTickets()
    } catch { toast.error('Erreur lors de la suppression') }
    finally { setProcessing(false) }
  }
  const handleIndividualRevoke = async () => {
    const tid = individualRevokeTicket
    if (!tid) return
    setIndividualRevokeTicket(null); setProcessing(true)
    try {
      await ticketsApi.revoke(selectedHotspotId, tid)
      const t = tickets.find((x) => (x.ticket_id || x.id) === tid)
      toast.success(`Ticket ${t?.username || tid} révoqué`)
      fetchTickets()
    } catch { toast.error('Erreur lors de la révocation') }
    finally { setProcessing(false) }
  }

  // ── Actions bulk ──────────────────────────────────────────────────
  const handleRevokeSelected = async () => {
    setShowRevokeConfirm(false); setProcessing(true)
    const ids = [...selectedIds]
    const results = await Promise.allSettled(
      ids.map((id) => ticketsApi.revoke(selectedHotspotId, id))
    )
    const ok = results.filter((r) => r.status === 'fulfilled').length
    if (ok > 0) toast.success(`${ok} ticket${ok > 1 ? 's' : ''} révoqué${ok > 1 ? 's' : ''}`)
    setSelectedIds(new Set()); setProcessing(false); fetchTickets()
  }
  const handleDeleteSelected = async () => {
    if (selectedIds.size === tickets.length && tickets.length > 0) {
      try { await ticketsApi.deleteAll(selectedHotspotId); toast.success('Tous les tickets supprimés') }
      catch { toast.error('Erreur lors de la suppression') }
    } else {
      setShowDeleteConfirm(false); setProcessing(true)
      const ids = [...selectedIds]
      await Promise.allSettled(ids.map((id) => ticketsApi.revoke(selectedHotspotId, id)))
      toast.success(`${ids.length} ticket${ids.length > 1 ? 's' : ''} supprimé${ids.length > 1 ? 's' : ''}`)
      setSelectedIds(new Set()); setProcessing(false)
    }
    fetchTickets()
  }

  // ── Export CSV ────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = filteredTickets.map((t) => ({
      Username: t.username || '',
      Profil: t.profile || '',
      Statut: t.status || '',
      'Limite temps': t.time_limit || 'Illimité',
      'Limite data': t.data_limit ? `${t.data_limit} MB` : 'Illimité',
      MAC: t.client_mac || '—',
      Téléphone: t.client_phone || '—',
      'Date création': t.created_at ? formatDateTime(t.created_at) : '—',
    }))
    const headers = Object.keys(rows[0] || {})
    if (!headers.length) { toast.error('Aucune donnée à exporter'); return }
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => `"${(r[h] || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `tickets_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success('Export CSV terminé')
  }

  // ── Helpers ───────────────────────────────────────────────────────
  const selectedHotspot = hotspots.find((h) => (h.hotspot_id || h.id) === selectedHotspotId)
  const hsLocation = selectedHotspot?.location || selectedHotspot?.mikrotik_ip || ''
  const goToImport = () => navigate(`/dashboard/tickets/new?hotspotId=${selectedHotspotId}`)

  // ═══════════════════════════════════════════════════════════════════
  // RENDU — États
  // ═══════════════════════════════════════════════════════════════════

  if (loadingHotspots) return <LoadingSkeleton type="table" isLight={isLight} rows={5} />

  if (hotspots.length === 0) {
    return (
      <EmptyState
        icon={Ticket}
        title="Aucun hotspot encore"
        message="Les tickets WiFi sont liés à un hotspot. Créez d'abord un hotspot, puis revenez ici pour générer et gérer vos tickets d'accès."
        action={{ label: 'Créer un hotspot', onClick: () => navigate('/dashboard/hotspots/new') }}
        isLight={isLight}
      />
    )
  }

  if (!selectedHotspotId) {
    return (
      <div className="space-y-6 relative">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
              isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400',
            )}>
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h1 className={cn('text-2xl font-black tracking-tight', textPrimary)}>Tickets WiFi</h1>
              <p className={cn('text-sm mt-0.5', textSecondary)}>
                Sélectionnez un hotspot pour voir ses tickets
              </p>
            </div>
          </div>
          {isAdmin && <ScopeToggle scope={scope} onChange={setScope} isLight={isLight} size="sm" />}
        </div>
        <HotspotGrid hotspots={hotspots} isLight={isLight} onSelect={(id) => {
          setSelectedHotspotId(id)
          setSearchParams({ hotspotId: id })
        }} cardCls={cardCls} />
      </div>
    )
  }

  if (loading) return <LoadingSkeleton type="table" isLight={isLight} rows={6} />

  if (error) return <ErrorState error={error} onRetry={fetchTickets} isLight={isLight} />

  // ═══════════════════════════════════════════════════════════════════
  // VUE PRINCIPALE — Hotspot sélectionné
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 relative">
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <TicketsHeader
        isLight={isLight}
        selectedHotspot={selectedHotspot}
        needsUpgrade={needsUpgrade}
        hsLocation={hsLocation}
        totalElements={totalElements}
        filteredCount={filteredTickets.length}
        onBack={() => { setSelectedHotspotId(''); setSearchParams({}) }}
      />

      {/* Actions : filtre, export, scope, import */}
      <TicketsActionsBar
        isLight={isLight}
        hotspots={hotspots}
        selectedHotspotId={selectedHotspotId}
        selectedHotspot={selectedHotspot}
        onHotspotSelect={(id) => { setSelectedHotspotId(id); setSearchParams({ hotspotId: id }) }}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        showExport={showExport}
        onExport={exportCSV}
        refreshing={refreshing}
        onRefresh={fetchTickets}
        isAdmin={isAdmin}
        scope={scope}
        onScopeChange={setScope}
        onImport={goToImport}
        inputBase={inputBase}
      />

      {/* Upgrade banner */}
      <UpgradeBanner needsUpgrade={needsUpgrade} isLight={isLight} onNavigate={() => navigate('/dashboard/subscriptions')} />

      {/* Contenu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('rounded-2xl relative overflow-hidden', cardCls)}
      >
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/2 rounded-full blur-[80px] pointer-events-none" />

        {canBulkManage && selectedIds.size > 0 && (
          <BulkActionsBar
            isLight={isLight}
            selectedCount={selectedIds.size}
            processing={processing}
            onRevoke={() => setShowRevokeConfirm(true)}
            onDelete={() => setShowDeleteConfirm(true)}
            onClear={() => setSelectedIds(new Set())}
          />
        )}

        {filteredTickets.length === 0 ? (
          <NoSearchResults query={globalSearch} isLight={isLight} />
        ) : (
          <>
            <TicketsTable
              tickets={filteredTickets}
              isLight={isLight}
              canBulkManage={canBulkManage}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              allChecked={allChecked}
              onToggleSelectAll={toggleSelectAll}
              revealedIds={revealedIds}
              onToggleReveal={(id) => setRevealedIds((p) => {
                const n = new Set(p)
                if (n.has(id)) n.delete(id); else n.add(id)
                return n
              })}
              onRevoke={setIndividualRevokeTicket}
              onDelete={setIndividualDeleteTicket}
            />
            <TicketsMobileCards
              tickets={filteredTickets}
              isLight={isLight}
              canBulkManage={canBulkManage}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              revealedIds={revealedIds}
              onToggleReveal={(id) => setRevealedIds((p) => {
                const n = new Set(p)
                if (n.has(id)) n.delete(id); else n.add(id)
                return n
              })}
              onRevoke={setIndividualRevokeTicket}
              onDelete={setIndividualDeleteTicket}
            />
          </>
        )}
      </motion.div>

      {/* Confirmations */}
      <ConfirmModal
        open={showRevokeConfirm}
        onClose={() => setShowRevokeConfirm(false)}
        onConfirm={handleRevokeSelected}
        title="Confirmer la révocation"
        message={
          selectedIds.size === 1
            ? 'Êtes-vous sûr de vouloir révoquer ce ticket ? Les sessions actives seront coupées.'
            : `Êtes-vous sûr de vouloir révoquer ces ${selectedIds.size} tickets ? Les sessions actives seront coupées.`
        }
        confirmLabel="Révoquer"
        loading={processing}
      />
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteSelected}
        title="Confirmer la suppression"
        message={
          selectedIds.size === 1
            ? 'Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.'
            : `Êtes-vous sûr de vouloir supprimer ces ${selectedIds.size} tickets ? Cette action est irréversible.`
        }
        confirmLabel="Supprimer"
        loading={processing}
      />
      <ConfirmModal
        open={!!individualRevokeTicket}
        onClose={() => !processing && setIndividualRevokeTicket(null)}
        onConfirm={handleIndividualRevoke}
        title="Révoquer ce ticket ?"
        message="Le ticket sera révoqué et la session active sera coupée. Cette action est irréversible."
        confirmLabel="Révoquer"
        loading={processing}
      />
      <ConfirmModal
        open={!!individualDeleteTicket}
        onClose={() => !processing && setIndividualDeleteTicket(null)}
        onConfirm={handleIndividualDelete}
        title="Supprimer ce ticket ?"
        message="Ce ticket révoqué sera définitivement supprimé. Cette action est irréversible."
        confirmLabel="Supprimer"
        loading={processing}
      />
    </div>
  )
}
