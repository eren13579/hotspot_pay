/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Activity, Download } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { sessionsApi, hotspotsApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/cn'
import EmptyState, { LoadingSkeleton, ErrorState, NoSearchResults } from '../../components/ui/EmptyState'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Pagination from '../../components/ui/Pagination'
import { SessionsHeader, SessionsStatusFilter, SessionsTable, SessionsMobileCards } from '../../components/sessions'

export default function SessionsPage() {
  const theme = useSelector((state) => state.ui.theme)
  const { user, role } = useAuth()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const uid = user?.userId || ''
  const isLight = theme === 'light'
  const searchQuery = useSelector((state) => state.ui.searchQuery)

  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const containerCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [hotspots, setHotspots] = useState([])
  const [selectedHotspotId, setSelectedHotspotId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [revokingId, setRevokingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [scope, setScope] = useState(isAdmin ? 'global' : 'self')
  const [page, setPage] = useState(0)
  const pageSize = 10

  // Charger les hotspots pour le filtre (re-fetch quand le scope change)
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await (isAdmin
          ? hotspotsApi.adminList(0, 100, scope)
          : hotspotsApi.list(uid, 0, 100, scope))
        const list = res?.data?.data?.content || res?.data?.data || []
        setHotspots(Array.isArray(list) ? list : [])
        // Auto-sélection du premier hotspot pour les non-admin
        if (!isAdmin && Array.isArray(list) && list.length > 0 && !selectedHotspotId) {
          setSelectedHotspotId(list[0].hotspot_id || list[0].id)
        }
      } catch {
        // silencieux
      }
    }
    fetch()
  }, [uid, isAdmin, scope, selectedHotspotId])

  // Transforme snake_case → camelCase (FastAPI → React)
  const toCamelCase = (obj) => {
    if (!obj || typeof obj !== 'object') return obj
    const out = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
        out[camel] = obj[key]
      }
    }
    return out
  }

  const fetchSessions = useCallback(async () => {
    try {
      if (loading) setLoading(true)
      else setRefreshing(true)
      setError(null)

      const res = selectedHotspotId
        ? await sessionsApi.byHotspot(selectedHotspotId)
        : await sessionsApi.all()

      const data = res?.data?.data || res?.data || []
      const list = Array.isArray(data) ? data : data.sessions || data.items || data.content || []
      setSessions(list.map(toCamelCase))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur réseau')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedHotspotId, loading])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  // Auto-refresh toutes les 30s
  useEffect(() => {
    if (!selectedHotspotId) return
    const id = setInterval(fetchSessions, 30000)
    return () => clearInterval(id)
  }, [selectedHotspotId, fetchSessions])

  const handleRevokeClick = (sessionId) => {
    setConfirmAction({ type: 'revoke', sessionId })
  }

  const handleDeleteClick = (sessionId) => {
    setConfirmAction({ type: 'delete', sessionId })
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    const { type, sessionId } = confirmAction
    setConfirmAction(null)

    if (type === 'revoke') {
      setRevokingId(sessionId)
      try {
        const { data } = await sessionsApi.revoke(sessionId)
        if (data?.success) {
          toast.success('Session révoquée avec succès')
          setSessions((prev) => prev.map((s) =>
            (s.id === sessionId || s.sessionId === sessionId) ? { ...s, status: 'REVOKED' } : s
          ))
        } else {
          toast.error(data?.message || 'Échec de la révocation')
        }
      } catch {
        toast.error('Échec de la révocation')
      } finally {
        setRevokingId(null)
      }
    } else if (type === 'delete') {
      setDeletingId(sessionId)
      try {
        const { data } = await sessionsApi.delete(sessionId)
        if (data?.success) {
          toast.success('Session supprimée')
          setSessions((prev) => prev.filter((s) =>
            s.id !== sessionId && s.sessionId !== sessionId
          ))
        } else {
          toast.error(data?.message || 'Échec de la suppression')
        }
      } catch {
        toast.error('Échec de la suppression')
      } finally {
        setDeletingId(null)
      }
    }
  }

  const exportCSV = () => {
    if (!filtered.length) { toast.error('Aucune donnee a exporter'); return }
    const headers = ['Reference', 'Client', 'Hotspot', 'Debut', 'Fin', 'Statut', 'Volume']
    const rows = filtered.map((s) => [
      s.reference || s.sessionId || s.id || '',
      s.clientPhone || s.client_phone || '',
      s.hotspotName || s.hotspot_name || '',
      s.startedAt || s.started_at || '',
      s.endedAt || s.ended_at || '',
      s.status || '',
      `${s.volumeMb || s.volume_mb || 0} MB`,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `sessions_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success(`Exporte ${filtered.length} session${filtered.length > 1 ? 's' : ''}`)
  }

  const filtered = sessions.filter((s) => {
    if (!statusFilter && !searchQuery) return true
    const matchStatus = !statusFilter || s.status === statusFilter
    const matchSearch = !searchQuery ||
      (s.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.clientPhone || s.client_phone || '').includes(searchQuery) ||
      (s.hotspotName || s.hotspot_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.macAddress || s.mac_address || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchSearch
  })

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedSessions = filtered.slice(page * pageSize, (page + 1) * pageSize)

  // Reset page quand les données ou le filtre changent
  useEffect(() => { setPage(0) }, [sessions.length, statusFilter, selectedHotspotId])

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-11 h-11 rounded-2xl bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-5 w-32 bg-slate-800 rounded-lg" />
            <div className="h-4 w-48 bg-slate-800 rounded-lg" />
          </div>
        </div>
        <LoadingSkeleton type="table" isLight={isLight} rows={5} />
      </div>
    )
  }

  // ── Non-admin sans hotspot ───────────────────────────────────
  if (!isAdmin && hotspots.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center',
            isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400',
          )}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className={cn('text-xl font-black tracking-tight', textPrimary)}>Sessions</h1>
            <p className={cn('text-xs', textSecondary)}>Aucune session</p>
          </div>
        </div>
        <EmptyState
          icon="Activity"
          title="Aucun hotspot"
          message="Les sessions WiFi sont créées automatiquement quand un utilisateur se connecte via un hotspot. Créez d'abord un hotspot pour voir apparaître les sessions ici."
          isLight={isLight}
        />
      </div>
    )
  }

  // ── Contenu principal (toujours avec header + filtre) ────────
  return (
    <div className="space-y-6">
      <SessionsHeader isLight={isLight} textPrimary={textPrimary} textSecondary={textSecondary}
        refreshing={refreshing} onRefresh={fetchSessions}
        hotspots={hotspots} selectedHotspotId={selectedHotspotId} onHotspotSelect={setSelectedHotspotId}
        totalCount={sessions.length}
        scope={scope} isAdmin={isAdmin} onScopeChange={setScope} />

      {/* Filtres — toujours visibles */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <SessionsStatusFilter value={statusFilter} onChange={setStatusFilter} isLight={isLight} />
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <button onClick={exportCSV}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer',
                isLight ? 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200' : 'text-emerald-400 hover:bg-emerald-500/10 border border-emerald-700/50')}>
              <Download className="w-3 h-3" /> CSV
            </button>
          )}
          <span className={cn('text-[10px]', textMuted)}>
            {filtered.length} sur {sessions.length} session{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <ErrorState error={error} onRetry={fetchSessions} isLight={isLight} title="Erreur de chargement" />
      )}

      {/* Contenu ou état vide */}
      {!error && (
        <>
          {filtered.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-2xl overflow-hidden', containerCls)}
            >
              <div className="hidden sm:block">
                <SessionsTable sessions={paginatedSessions} isLight={isLight} textMuted={textMuted}
                  onRevoke={handleRevokeClick} revokingId={revokingId}
                  onDelete={handleDeleteClick} deletingId={deletingId} />
              </div>
              <div className="sm:hidden p-3">
                <SessionsMobileCards sessions={paginatedSessions} isLight={isLight} textMuted={textMuted}
                  onRevoke={handleRevokeClick} revokingId={revokingId}
                  onDelete={handleDeleteClick} deletingId={deletingId} />
              </div>

              {/* Pagination */}
              <Pagination page={page} totalPages={totalPages} onChange={setPage} isLight={isLight} />
            </motion.div>
          ) : (
            <EmptyState
              title={statusFilter ? 'Aucune session avec ce filtre' : 'Aucune session'}
              message={statusFilter
                ? 'Aucune session ne correspond au statut sélectionné. Essayez un autre filtre.'
                : selectedHotspotId
                  ? "Ce hotspot n'a aucune session pour le moment. Les sessions apparaissent lorsqu'un client se connecte au WiFi."
                  : 'Les sessions apparaîtront lorsque des clients se connecteront à vos hotspots WiFi.'}
              icon="Activity" isLight={isLight}
            />
          )}

          {filtered.length === 0 && sessions.length > 0 && (
            <NoSearchResults isLight={isLight} onClear={() => setStatusFilter('')} />
          )}
        </>
      )}

      {/* Modal de confirmation révocation / suppression */}
      <ConfirmModal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmAction?.type === 'revoke' ? 'Révoquer la session' : 'Supprimer la session'}
        message={confirmAction?.type === 'revoke'
          ? 'Le client sera déconnecté immédiatement et devra se reconnecter pour accéder à Internet. Cette action est irréversible.'
          : 'Cette session sera définitivement supprimée de la base de données. Cette action est irréversible.'}
        confirmLabel={confirmAction?.type === 'revoke' ? 'Révoquer' : 'Supprimer'}
        loading={confirmAction?.type === 'revoke' ? !!revokingId : !!deletingId}
        delay={3}
      />
    </div>
  )
}
