/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Globe, Eye, Shield, Activity, CreditCard, Download, RefreshCw, ExternalLink } from 'lucide-react'
import { dashboardApi, hotspotsApi, routerApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { formatXAF, formatDateTime, timeAgo } from '../../utils/format'
import { cn } from '../../utils/cn'
import EditHotspotModal from '../../components/ui/EditHotspotModal'
import TokenGeneratedModal from '../../components/ui/TokenGeneratedModal'
import { usePortalLink } from '../../components/ui/PortalLinkSection'
import { resolveHotspotSlug, storeSlugMapping } from '../../utils/slug'
import { LoadingSkeleton, ErrorState } from '../../components/ui/EmptyState'
import HotspotTabs from '../../components/dashboard/HotspotTabs'
import ActivityChart from '../../components/dashboard/ActivityChart'
import TopClients from '../../components/dashboard/TopClients'
import AuditTimeline from '../../components/dashboard/AuditTimeline'
import {
  InfoRow, StatCard, HotspotDetailHeader, HotspotTokenDisplay,
  LinksModal, RevokeConfirmModal,
} from '../../components/hotspots/detail'

const PLAN_LEVEL = { STANDARD: 0, PRO: 1, PREMIUM: 2 }

export default function HotspotDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const theme = useSelector((state) => state.ui.theme)
  const { user } = useAuth()
  const planLevel = PLAN_LEVEL[user?.planType || 'STANDARD'] ?? 0
  const isLight = theme === 'light'

  const [id, setId] = useState(() => {
    const fullId = resolveHotspotSlug(slug)
    return (fullId && fullId.length > 18) ? fullId : null
  })
  const [slugLoading, setSlugLoading] = useState(!id)

  // Fallback slug → ID
  useEffect(() => {
    if (id) return
    const uid = user?.userId || user?.id
    if (!uid) return
    ;(async () => {
      const prefix = resolveHotspotSlug(slug)
      try {
        const res = await hotspotsApi.list(uid)
        const items = res?.data?.data || res?.data || []
        const match = items.find((h) => (h.hotspot_id || h.id || '').startsWith(prefix))
        if (match) {
          const hid = match.hotspot_id || match.id
          storeSlugMapping(slug, hid); setId(hid)
        } else { setId(prefix) }
      } catch { setId(prefix) }
      setSlugLoading(false)
    })()
  }, [id, slug, user])

  const [hotspot, setHotspot] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [testing, setTesting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tokenGeneratedData, setTokenGeneratedData] = useState(null)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [showLinksModal, setShowLinksModal] = useState(false)
  const [savedPollingUrl, setSavedPollingUrl] = useState('')
  const [storedToken, setStoredToken] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const hasDataRef = useRef(false)

  const { link: portalLink, saveLink: savePortalLink, clearLink: clearPortalLink } = usePortalLink(id)
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const containerCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'

  // Restaurer polling_url et token du localStorage
  useEffect(() => {
    setSavedPollingUrl(localStorage.getItem(`polling_url_${id}`) || '')
    const savedToken = localStorage.getItem(`script_token_${id}`)
    if (savedToken) setStoredToken(savedToken)
  }, [id])

  const fetchDetail = useCallback(async () => {
    try {
      if (hasDataRef.current) setRefreshing(true); else setLoading(true)
      setError(null)
      const uid = user?.userId || ''
      const [hotspotRes, statsRes] = await Promise.all([
        hotspotsApi.get(id).catch(() => null),
        dashboardApi.hotspotStats(id, uid).catch(() => null),
      ])
      if (hotspotRes?.data?.success) { setHotspot(hotspotRes.data.data || hotspotRes.data); hasDataRef.current = true }
      else if (hotspotRes?.data?.data) { setHotspot(hotspotRes.data.data); hasDataRef.current = true }
      else throw new Error('Hotspot introuvable')
      if (statsRes?.data?.success) setStats(statsRes.data.data)
    } catch (err) { setError(err.response?.data?.message || err.message || 'Erreur réseau') }
    finally { setLoading(false); setRefreshing(false) }
  }, [id, user])

  const silentRefresh = useCallback(async () => {
    const uid = user?.userId || ''
    try {
      const [hotspotRes, statsRes] = await Promise.all([
        hotspotsApi.get(id).catch(() => null),
        dashboardApi.hotspotStats(id, uid).catch(() => null),
      ])
      if (hotspotRes?.data?.success) setHotspot(hotspotRes.data.data || hotspotRes.data)
      else if (hotspotRes?.data?.data) setHotspot(hotspotRes.data.data)
      if (statsRes?.data?.success) setStats(statsRes.data.data)
    } catch { /* silence */ }
  }, [id, user])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const handleTest = async () => {
    setTesting(true)
    try {
      const { data } = await hotspotsApi.test(id)
      if (data?.success) toast.success('Connexion réussie au routeur')
      else toast.error(data?.message || 'Échec du test de connexion')
      silentRefresh()
    } catch { toast.error('Échec du test de connexion') }
    finally { setTesting(false) }
  }

  const handleGenerateToken = async () => {
    setGenerating(true)
    try {
      const { data } = await hotspotsApi.generateToken(id)
      if (data?.success) {
        const tokenInfo = data.data || data
        setTokenGeneratedData(tokenInfo); setShowTokenModal(true)
        const routerToken = tokenInfo.router_token || tokenInfo.token || ''
        if (routerToken) { localStorage.setItem(`script_token_${id}`, routerToken); setStoredToken(routerToken) }
        const pollUrl = tokenInfo.polling_url || ''
        if (pollUrl) { localStorage.setItem(`polling_url_${id}`, pollUrl); setSavedPollingUrl(pollUrl) }
        const portalUrl = tokenInfo.portal_url || tokenInfo.portalUrl || ''
        if (portalUrl) savePortalLink(portalUrl)
        toast.success('Token généré avec succès'); silentRefresh()
      } else toast.error(data?.message || 'Échec de la génération du token')
    } catch { toast.error('Échec de la génération du token') }
    finally { setGenerating(false) }
  }

  const handleRevokeToken = async () => {
    setConfirmRevoke(false)
    try {
      const { data } = await hotspotsApi.revokeToken(id)
      if (data?.success) {
        toast.success('Token révoqué')
        localStorage.removeItem(`script_token_${id}`); localStorage.removeItem(`polling_url_${id}`)
        setStoredToken(''); setSavedPollingUrl(''); setTokenGeneratedData(null); clearPortalLink()
        silentRefresh()
      } else toast.error(data?.message || 'Échec de la révocation')
    } catch { toast.error('Échec de la révocation') }
  }

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce hotspot ? Cette action est irréversible.')) return
    setDeleting(true)
    try { await hotspotsApi.delete(id); toast.success('Hotspot supprimé'); navigate('/dashboard/hotspots', { replace: true }) }
    catch { toast.error('Échec de la suppression') }
    finally { setDeleting(false) }
  }

  const handleSaveEdit = async (formData) => {
    setSaving(true)
    try {
      const { data } = await hotspotsApi.update(id, formData)
      if (data?.success) { toast.success('Hotspot modifié avec succès'); setIsEditing(false); silentRefresh() }
      else toast.error(data?.message || 'Échec de la modification')
    } catch { toast.error('Échec de la modification') }
    finally { setSaving(false) }
  }

  const handleDownloadScript = async () => {
    const token = tokenGeneratedData?.router_token || tokenGeneratedData?.token || storedToken
    if (!token) { toast.error("Token non disponible. Générez d'abord un token."); return }
    setDownloading(true)
    try {
      const response = await routerApi.downloadScript(id, { token })
      const contentDisposition = response.headers?.['content-disposition']
      let filename = `hotspotpay-mikrotik-${id.slice(0, 8)}.rsc`
      if (contentDisposition) { const m = contentDisposition.match(/filename="?(.+?)"?$/); if (m) filename = m[1] }
      const url = window.URL.createObjectURL(response.data); const a = document.createElement('a')
      a.href = url; a.setAttribute('download', filename); a.click()
      window.URL.revokeObjectURL(url)
      localStorage.removeItem(`script_token_${id}`); setStoredToken('')
      toast.success('Téléchargement lancé'); silentRefresh()
    } catch (err) {
      let message = 'Erreur de téléchargement. Vérifiez que le backend est démarré (FastAPI sur le port 8443).'
      try {
        if (err.response?.data instanceof Blob) {
          const text = await err.response.data.text()
          if (text && text.startsWith('{')) { const j = JSON.parse(text); message = j.message || j.detail || message }
          else if (text && text.length < 200) message = text
        } else if (err.response?.data) message = err.response.data.message || err.response.data.detail || message
        else if (err.message) message = err.message
      } catch { /* ignore */ }
      toast.error(message)
    } finally { setDownloading(false) }
  }

  const handleDownloadFromModal = async () => { await handleDownloadScript(); setShowTokenModal(false) }

  // ═══════════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════════

  if (slugLoading || loading) return <LoadingSkeleton type="detail" isLight={isLight} rows={4} />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ErrorState
          error={error}
          onRetry={fetchDetail}
          isLight={isLight}
          title="Hotspot introuvable"
        />
        <button onClick={() => navigate('/dashboard/hotspots')} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition-all mt-3">
          Retour au dashboard
        </button>
      </div>
    )
  }

  const h = hotspot || {}
  const hasToken = h.router_token_configured

  return (
    <div className="space-y-6">
      <HotspotDetailHeader
        isLight={isLight} hotspot={h} refreshing={refreshing} onRefresh={fetchDetail}
        onBack={() => navigate('/dashboard/hotspots')}
        planLevel={planLevel} testing={testing} onTest={handleTest}
        hasToken={hasToken} storedToken={storedToken} generating={generating}
        onGenerateToken={handleGenerateToken} onEdit={() => setIsEditing(true)}
        deleting={deleting} onDelete={handleDelete}
      />

      {/* Infos + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn('lg:col-span-2 rounded-2xl p-6', containerCls)}>
          <h3 className={cn('text-sm font-bold mb-4', textPrimary)}>Informations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={Globe} label="Adresse IP" value={h.mikrotik_ip || '—'} isLight={isLight} />
            <InfoRow icon={Globe} label="Port" value={h.mikrotik_port?.toString() || '—'} isLight={isLight} />
            <InfoRow icon={Globe} label="Localisation" value={h.location || '—'} isLight={isLight} />
            <InfoRow icon={Globe} label="Marque" value={h.router_brand || '—'} isLight={isLight} />
            <InfoRow icon={Globe} label="Modèle" value={h.router_type || '—'} isLight={isLight} />
            <InfoRow icon={Globe} label="Profil" value={h.hotspot_profile || '—'} isLight={isLight} />
            <InfoRow icon={Globe} label="Dernier ping" value={h.last_ping_at ? timeAgo(h.last_ping_at) : 'Jamais'} isLight={isLight} />
            <InfoRow icon={Globe} label="Créé le" value={h.created_at ? formatDateTime(h.created_at) : '—'} isLight={isLight} />
            <InfoRow icon={Globe} label="Dernière modif" value={h.updated_at ? formatDateTime(h.updated_at) : '—'} isLight={isLight} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cn('rounded-2xl p-6', containerCls)}>
          <h3 className={cn('text-sm font-bold mb-4', textPrimary)}>Statistiques</h3>
          <div className="space-y-3">
            <StatCard icon={Activity} label="Sessions totales" value={stats?.totalSessions?.toLocaleString('fr-FR') || '0'} color="text-emerald-400" bg="bg-emerald-500/10" isLight={isLight} />
            <StatCard icon={CreditCard} label="Revenu total" value={formatXAF(stats?.totalRevenue || 0)} color="text-rose-400" bg="bg-rose-500/10" isLight={isLight} />
            <div className={cn('rounded-xl p-4', hasToken ? (isLight ? 'bg-emerald-50' : 'bg-emerald-500/5') : (isLight ? 'bg-amber-50' : 'bg-amber-500/5'))}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className={cn('w-4 h-4', hasToken ? 'text-emerald-400' : 'text-amber-400')} />
                <span className={cn('text-xs font-semibold', hasToken ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-amber-700' : 'text-amber-400'))}>
                  {hasToken ? 'Token configuré' : 'Aucun token'}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {storedToken && (
                  <button onClick={handleDownloadScript} disabled={downloading} className={cn('flex items-center gap-1.5 h-8 px-3 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-50', isLight ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30')}>
                    {downloading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    {downloading ? 'Téléchargement...' : 'Script'}
                  </button>
                )}
                {(hasToken || storedToken) && (
                  <button onClick={() => setConfirmRevoke(true)} className={cn('flex items-center gap-1.5 h-8 px-3 rounded-lg text-[10px] font-semibold transition-all', isLight ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30')}>
                    <Shield className="w-3 h-3" />Révoquer
                  </button>
                )}
              </div>
              {!hasToken && !storedToken && (
                <p className={cn('text-[10px]', isLight ? 'text-amber-600' : 'text-amber-400')}>
                  Générez un token pour sécuriser la communication avec le routeur.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* URLs */}
      <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        onClick={() => setShowLinksModal(true)}
        className={cn('inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all', isLight ? 'text-blue-600 hover:bg-blue-50 border border-blue-200 bg-white' : 'text-blue-400 hover:bg-blue-500/10 border border-blue-700/50 bg-slate-900')}>
        <Eye className="w-4 h-4" />URLs du hotspot
      </motion.button>

      {/* Portail captif (PRO+) */}
      {planLevel >= 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          <a
            href={portalLink || `${window.location.origin}/portal/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all',
              isLight
                ? 'text-purple-600 hover:bg-purple-50 border border-purple-200 bg-white'
                : 'text-purple-400 hover:bg-purple-500/10 border border-purple-700/50 bg-slate-900',
            )}
          >
            <ExternalLink className="w-4 h-4" /> Voir le portail captif
          </a>
        </motion.div>
      )}

      {/* Token */}
      <HotspotTokenDisplay isLight={isLight} storedToken={storedToken} routerToken={h.router_token} downloading={downloading} onDownload={handleDownloadScript} />

      {/* Graphiques PRO+ */}
      {planLevel >= 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityChart hotspotId={id} isLight={isLight} />
          <TopClients hotspotId={id} isLight={isLight} />
        </div>
      )}

      {/* Timeline PREMIUM */}
      {planLevel >= 2 && <AuditTimeline hotspotId={id} isLight={isLight} />}

      {/* Tabs */}
      <HotspotTabs hotspotId={id} planType={user?.planType || 'STANDARD'} />

      {/* Modaux */}
      <EditHotspotModal open={isEditing} onClose={() => setIsEditing(false)} hotspot={h} onSave={handleSaveEdit} saving={saving} />
      <TokenGeneratedModal open={showTokenModal} onClose={() => setShowTokenModal(false)} tokenData={tokenGeneratedData} hotspotName={h.name} onDownloadScript={handleDownloadFromModal} />
      <LinksModal open={showLinksModal} onClose={() => setShowLinksModal(false)} portalLink={portalLink} savedPollingUrl={savedPollingUrl} hotspotName={h.name} isLight={isLight} />
      <RevokeConfirmModal open={confirmRevoke} onClose={() => setConfirmRevoke(false)} onConfirm={handleRevokeToken} hotspotName={h.name} isLight={isLight} />
    </div>
  )
}
