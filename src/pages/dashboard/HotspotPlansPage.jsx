/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  Tag, Wifi, Search, X, ChevronDown, Plus, RefreshCw,
} from 'lucide-react'
import { hotspotPlansApi, hotspotsApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/cn'
import PlansTabContent from '../../components/dashboard/PlansTabContent'
import HotspotGrid from '../../components/tickets/HotspotGrid'
import ScopeToggle from '../../components/ui/ScopeToggle'
import EmptyState, { LoadingSkeleton, ErrorState } from '../../components/ui/EmptyState'

export default function HotspotPlansPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const theme = useSelector((state) => state.ui.theme)
  const { user, role } = useAuth()
  const isLight = theme === 'light'
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'

  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const cardCls = isLight
    ? 'bg-white border border-slate-200 shadow-sm'
    : 'bg-slate-900/50 border border-slate-800 shadow-xl shadow-black/10'
  // Scope
  const [scope, setScope] = useState(isAdmin ? 'global' : 'self')

  // Hotspots
  const [hotspots, setHotspots] = useState([])
  const [loadingHotspots, setLoadingHotspots] = useState(true)
  const preselectedId = searchParams.get('hotspotId') || null
  const [selectedId, setSelectedId] = useState(preselectedId)

  // Plans
  const [plansData, setPlansData] = useState(null)
  const [plansLoading, setPlansLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [plansFetched, setPlansFetched] = useState(false)
  const [plansError, setPlansError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Hotspot selector dropdown (action bar)
  const [hotspotOpen, setHotspotOpen] = useState(false)
  const [hotspotSearch, setHotspotSearch] = useState('')
  const hotspotRef = useRef(null)

  useEffect(() => {
    const handle = (e) => {
      if (hotspotRef.current && !hotspotRef.current.contains(e.target)) {
        setHotspotOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // ── Charger les hotspots ──────────────────────────────────────────
  const initialPreselectedRef = useRef(preselectedId)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingHotspots(true)
        const uid = user?.userId || user?.id || ''
        const isGlobal = isAdmin && scope === 'global'
        const res = await (isGlobal
          ? hotspotsApi.adminList(0, 100)
          : hotspotsApi.list(uid, 0, 100, scope))
        if (cancelled) return
        const raw = res?.data?.data?.content || res?.data?.data || []
        const items = Array.isArray(raw) ? raw : []
        setHotspots(items)
        if (!initialPreselectedRef.current && items.length === 1) {
          const id = items[0].hotspot_id || items[0].id
          setSelectedId(id)
          setSearchParams({ hotspotId: id }, { replace: true })
        }
      } catch { /* silencieux */ }
      finally { if (!cancelled) setLoadingHotspots(false) }
    })()
    return () => { cancelled = true }
  }, [scope, isAdmin]) // eslint-disable-line

  // Reset hotspot au changement de scope
  const prevScopeRef = useRef(scope)
  useEffect(() => {
    if (prevScopeRef.current && prevScopeRef.current !== scope) {
      setSelectedId(null)
      setPlansFetched(false)
      setPlansData(null)
      setPlansError(null)
      setSearchParams({})
    }
    prevScopeRef.current = scope
  }, [scope, setSearchParams])

  // ── Charger les forfaits ──────────────────────────────────────────
  const hasPlansRef = useRef(false)
  const fetchPlans = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    ;(async () => {
      try {
        if (!hasPlansRef.current) setPlansLoading(true); else setRefreshing(true)
        setPlansError(null)
        const { data: res } = await hotspotPlansApi.list(selectedId)
        if (cancelled) return
        const loaded = res?.data ?? res ?? null
        setPlansData(loaded)
        const items = Array.isArray(loaded) ? loaded : loaded?.plans ?? loaded?.items ?? loaded?.content ?? []
        if (items.length > 0) hasPlansRef.current = true
      } catch (err) {
        if (cancelled) return
        setPlansError(err?.response?.data?.message || err?.message || 'Erreur réseau')
        setPlansData([])
      } finally {
        if (!cancelled) { setPlansLoading(false); setRefreshing(false); setPlansFetched(true) }
      }
    })()
    return () => { cancelled = true }
  }, [selectedId, refreshKey])

  const selectedHotspot = hotspots.find((h) => (h.hotspot_id || h.id) === selectedId)
  const hsLocation = selectedHotspot?.location || selectedHotspot?.mikrotik_ip || ''
  const planCount = Array.isArray(plansData) ? plansData.length
    : plansData?.plans?.length ?? plansData?.items?.length ?? plansData?.content?.length ?? 0

  // Hotspot dropdown filtered
  const filteredHotspots = hotspots.filter((h) => {
    if (!hotspotSearch) return true
    const q = hotspotSearch.toLowerCase()
    return (h.name || '').toLowerCase().includes(q) || (h.location || '').toLowerCase().includes(q)
  })

  const handleSelectHotspot = (id) => {
    setSelectedId(id)
    setSearchParams({ hotspotId: id }, { replace: true })
    setHotspotOpen(false)
    setHotspotSearch('')
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDU — États
  // ═══════════════════════════════════════════════════════════════════

  if (loadingHotspots) return <LoadingSkeleton type="table" isLight={isLight} rows={5} />

  if (hotspots.length === 0) {
    return (
      <EmptyState
        icon={Wifi}
        title="Aucun hotspot encore"
        message="Les forfaits WiFi sont liés à un hotspot. Créez d'abord un hotspot, puis revenez ici pour créer et gérer vos forfaits d'accès."
        action={{ label: 'Créer un hotspot', onClick: () => navigate('/dashboard/hotspots/new') }}
        isLight={isLight}
      />
    )
  }

  if (!selectedId) {
    return (
      <div className="space-y-6 relative">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex items-center justify-between gap-4 relative">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
              isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400',
            )}>
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h1 className={cn('text-2xl font-black tracking-tight', textPrimary)}>Forfaits WiFi</h1>
              <p className={cn('text-sm mt-0.5', textSecondary)}>
                Sélectionnez un hotspot pour voir ses forfaits
              </p>
            </div>
          </div>
          {isAdmin && <ScopeToggle scope={scope} onChange={setScope} isLight={isLight} size="sm" />}
        </div>
        <HotspotGrid hotspots={hotspots} isLight={isLight} onSelect={(id) => {
          setSelectedId(id)
          setSearchParams({ hotspotId: id }, { replace: true })
        }} cardCls={cardCls} />
      </div>
    )
  }

  if (plansLoading) return <LoadingSkeleton type="table" isLight={isLight} rows={6} />

  if (plansError) return <ErrorState error={plansError} onRetry={fetchPlans} isLight={isLight} />

  // ═══════════════════════════════════════════════════════════════════
  // VUE PRINCIPALE — Hotspot sélectionné
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 relative">
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ════════ HEADER (comme TicketsHeader) ════════ */}
      <div className="flex flex-wrap items-center justify-between gap-4 relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setSelectedId(null); setSearchParams({}) }}
            className={cn(
              'p-2.5 rounded-xl transition-all shrink-0 hover:scale-105 active:scale-95',
              isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400',
            )}
            title="Changer de hotspot"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center',
            isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400',
          )}>
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={cn('text-2xl font-black tracking-tight', textPrimary)}>
                {selectedHotspot?.name || 'Forfaits'}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm mt-0.5">
              <span className={textSecondary}>
                {planCount} forfait{planCount !== 1 ? 's' : ''}
              </span>
              {hsLocation && (
                <>
                  <span className={textMuted}>·</span>
                  <span className={textMuted}>{hsLocation}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════ ACTIONS BAR (comme TicketsActionsBar) ════════ */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Hotspot selector (compact) */}
          <div className="relative" ref={hotspotRef}>
            <button
              type="button"
              onClick={() => setHotspotOpen(!hotspotOpen)}
              className={cn(
                'flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-semibold transition-all max-w-45',
                isLight
                  ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-900 border border-slate-700/50 text-slate-300 hover:bg-slate-800',
              )}
            >
              <Wifi className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{selectedHotspot?.name || 'Hotspot'}</span>
              <ChevronDown className={cn('w-3 h-3 shrink-0 transition-transform', hotspotOpen && 'rotate-180')} />
            </button>

            {hotspotOpen && (
              <div className={cn(
                'absolute z-50 mt-1 min-w-55 rounded-xl border shadow-xl overflow-hidden',
                isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-800 border-slate-700 shadow-black/50',
              )}>
                <div className={cn(
                  'flex items-center gap-2 px-3 py-2 border-b',
                  isLight ? 'border-slate-200' : 'border-slate-700',
                )}>
                  <Search className={cn('w-3.5 h-3.5', textMuted)} />
                  <input
                    type="text"
                    value={hotspotSearch}
                    onChange={(e) => setHotspotSearch(e.target.value)}
                    placeholder="Chercher…"
                    className={cn('flex-1 text-xs outline-none bg-transparent', isLight ? 'text-slate-900' : 'text-white')}
                    autoFocus
                  />
                  {hotspotSearch && (
                    <button onClick={() => setHotspotSearch('')} className={cn('hover:text-white transition-colors', textMuted)}>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {filteredHotspots.map((hs) => {
                    const hid = hs.hotspot_id || hs.id
                    const sel = hid === selectedId
                    return (
                      <button
                        key={hid}
                        type="button"
                        onClick={() => handleSelectHotspot(hid)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition-colors',
                          sel
                            ? isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/10 text-amber-300'
                            : isLight ? 'hover:bg-slate-50 text-slate-700' : 'hover:bg-slate-700/50 text-slate-300',
                        )}
                      >
                        <Wifi className={cn('w-3.5 h-3.5 shrink-0', sel ? 'text-amber-500' : textMuted)} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{hs.name || 'Sans nom'}</p>
                          {hs.location && <p className={cn('truncate', textMuted)}>{hs.location}</p>}
                        </div>
                        {sel && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                      </button>
                    )
                  })}
                  {filteredHotspots.length === 0 && (
                    <div className={cn('px-3 py-6 text-center text-xs', textMuted)}>Aucun hotspot trouvé</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Scope toggle (admin) */}
          {isAdmin && (
            <ScopeToggle scope={scope} onChange={setScope} isLight={isLight} size="sm" />
          )}
        </div>

        {/* Créer un forfait + Refresh (à droite) */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(`/dashboard/forfaits/new?hotspotId=${selectedId}`)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Créer un forfait</span>
          </button>
          <button
            onClick={fetchPlans}
            disabled={refreshing}
            className={cn(
              'flex items-center justify-center h-10 w-10 rounded-xl transition-all',
              isLight
                ? 'text-slate-400 hover:bg-slate-100 border border-slate-200 bg-white'
                : 'text-slate-500 hover:bg-slate-800 border border-slate-700/50 bg-slate-900',
            )}
            title="Rafraîchir"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ════════ CONTENU ════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('rounded-2xl p-5 relative overflow-hidden', cardCls)}
      >
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/2 rounded-full blur-[80px] pointer-events-none" />

        {selectedId && plansFetched && (
          <PlansTabContent
            hotspotId={selectedId}
            data={plansData}
            isLight={isLight}
            onRefresh={fetchPlans}
          />
        )}
      </motion.div>
    </div>
  )
}
