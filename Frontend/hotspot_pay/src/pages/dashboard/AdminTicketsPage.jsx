import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Search, X, Mail, Phone, User,
  Clock, CheckCircle, AlertCircle, RefreshCw, ArrowLeft,
  Send, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { contactAdminApi } from '../../api/endpoints'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../utils/cn'
import { timeAgo, formatDateTime } from '../../utils/format'
import EmptyState, { LoadingSkeleton, ErrorState, NoSearchResults } from '../../components/ui/EmptyState'

const ROWS_PER_PAGE = 15

const STATUS_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'OPEN', label: 'Ouverts' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'RESOLVED', label: 'Résolus' },
  { value: 'CLOSED', label: 'Fermés' },
]

const STATUS_META = {
  OPEN:        { label: 'Ouvert',      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',     icon: AlertCircle },
  IN_PROGRESS: { label: 'En cours',    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',  icon: Clock },
  RESOLVED:    { label: 'Résolu',      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
  CLOSED:      { label: 'Fermé',       color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',  icon: X },
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.OPEN
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium', meta.color)}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  )
}

/* ─── Squelette ──────────────────────────────────────────── */
function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse p-5 flex gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-slate-800" />
            <div className="h-3 w-1/2 rounded bg-slate-800/60" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Page principale ──────────────────────────────────── */
export default function AdminTicketsPage() {
  const { role, user } = useAuth()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'

  const [messages, setMessages] = useState([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Détail
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalElements / ROWS_PER_PAGE))

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = { page, size: ROWS_PER_PAGE }
      if (statusFilter) params.status = statusFilter
      if (searchQuery.trim()) params.search = searchQuery
      const { data } = await contactAdminApi.list(params)
      const result = data?.data
      if (result) {
        setMessages(result.content || [])
        setTotalElements(result.totalElements ?? 0)
      }
    } catch (err) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, searchQuery])

  useEffect(() => { fetchList() }, [fetchList])

  const fetchDetail = useCallback(async (id) => {
    setDetailLoading(true)
    try {
      const { data } = await contactAdminApi.get(id)
      setDetail(data?.data || null)
    } catch (err) {
      toast.error('Erreur de chargement du message')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const openDetail = useCallback(async (id) => {
    setSelectedId(id)
    setReplyText('')
    await fetchDetail(id)
  }, [fetchDetail])

  const closeDetail = useCallback(() => {
    setSelectedId(null)
    setDetail(null)
    setReplyText('')
  }, [])

  const handleReply = useCallback(async () => {
    if (!replyText.trim() || !selectedId) return
    setSending(true)
    try {
      await contactAdminApi.reply(selectedId, { adminReply: replyText.trim() })
      toast.success('Réponse envoyée avec succès')
      setReplyText('')
      await fetchDetail(selectedId)
      fetchList() // refresh list too
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de l\'envoi')
    } finally {
      setSending(false)
    }
  }, [replyText, selectedId, fetchDetail, fetchList])

  const handleStatusChange = useCallback(async (id, newStatus) => {
    try {
      await contactAdminApi.updateStatus(id, { status: newStatus })
      toast.success(`Statut changé en ${STATUS_META[newStatus]?.label || newStatus}`)
      if (selectedId === id) {
        await fetchDetail(id)
      }
      fetchList()
    } catch (err) {
      toast.error('Erreur de mise à jour du statut')
    }
  }, [selectedId, fetchDetail, fetchList])

  const handleMarkRead = useCallback(async (id) => {
    try {
      await contactAdminApi.markRead(id)
      if (selectedId === id) await fetchDetail(id)
      fetchList()
    } catch (err) {
      // silent
    }
  }, [selectedId, fetchDetail, fetchList])

  // ── Sécurité ──
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  // ── Détail (vue plein écran) ──
  if (selectedId && detail) {
    return (
      <div className="space-y-6">
        <button
          onClick={closeDetail}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>

        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl p-6 space-y-5">
          {/* En-tête du message */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{detail.fullName}</h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{detail.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{detail.phone}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={detail.status} />
              <select
                value={detail.status || 'OPEN'}
                onChange={(e) => handleStatusChange(detail.id, e.target.value)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg border text-[10px] font-medium cursor-pointer',
                  'bg-slate-800 border-slate-700 text-slate-300',
                  'focus:outline-none focus:border-blue-500/50',
                )}
              >
                {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <p className="text-[10px] text-slate-500">
            Reçu le {formatDateTime(detail.createdAt)}
            {!detail.isRead && (
              <button
                onClick={() => handleMarkRead(detail.id)}
                className="ml-3 text-blue-400 hover:text-blue-300 underline cursor-pointer"
              >
                Marquer lu
              </button>
            )}
          </p>

          {/* Message */}
          <div className="rounded-xl bg-slate-800/40 p-4">
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{detail.message || 'Aucun message'}</p>
          </div>

          {/* Réponse admin */}
          {detail.adminReply && (
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4">
              <p className="text-[10px] font-semibold text-emerald-400 mb-2">Votre réponse :</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{detail.adminReply}</p>
            </div>
          )}

          {/* Formulaire de réponse */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400">Répondre à ce message</label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              placeholder="Écrivez votre réponse ici…"
              className={cn(
                'w-full rounded-xl border p-3 text-sm resize-none transition-all',
                'bg-slate-800/40 border-slate-700/60 text-white placeholder-slate-500',
                'focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20',
              )}
            />
            <div className="flex justify-end">
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/25',
                  'hover:shadow-amber-500/40 active:scale-[0.97]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {sending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {sending ? 'Envoi…' : 'Envoyer la réponse'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Détail en chargement ──
  if (selectedId && detailLoading) {
    return (
      <div className="space-y-6">
        <button onClick={closeDetail} className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-all cursor-pointer">
          <ArrowLeft className="w-4 h-4" />Retour
        </button>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl p-6 animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-slate-800" />
          <div className="h-24 rounded-xl bg-slate-800" />
          <div className="h-24 rounded-xl bg-slate-800" />
        </div>
      </div>
    )
  }

  // ── Liste principale ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-xl shadow-amber-500/20">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Tickets Support</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Messages du formulaire de contact · {totalElements} ticket{totalElements !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={fetchList}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Actualiser
        </button>
      </motion.div>

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone…"
            className={cn(
              'w-full pl-9 pr-8 py-2 rounded-xl border text-xs transition-all',
              'bg-slate-900/60 border-slate-700/60 text-white placeholder-slate-500',
              'focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20',
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
          className={cn(
            'px-3 py-2 rounded-xl border text-xs',
            'bg-slate-900/60 border-slate-700/60 text-white',
            'focus:outline-none focus:border-blue-500/50 cursor-pointer',
          )}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchList} />
      ) : messages.length === 0 ? (
        searchQuery || statusFilter ? (
          <NoSearchResults onClear={() => { setSearchQuery(''); setStatusFilter('') }} />
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="Aucun message"
            description="Aucun message de contact n'a encore été reçu."
          />
        )
      ) : (
        /* Liste */
        <div className="space-y-3">
          {messages.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => openDetail(m.id)}
              className={cn(
                'w-full text-left rounded-2xl border p-5 transition-all cursor-pointer group',
                'bg-slate-900/40 border-slate-800/60',
                'hover:bg-slate-800/40 hover:border-blue-500/20',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className={cn(
                    'w-10 h-10 rounded-full shrink-0 flex items-center justify-center',
                    m.isRead ? 'bg-slate-800' : 'bg-blue-500/15',
                  )}>
                    <User className={cn('w-5 h-5', m.isRead ? 'text-slate-500' : 'text-blue-400')} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white">{m.fullName}</span>
                      {!m.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                      )}
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {m.email} · {m.phone}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {m.message || 'Aucun message'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">{timeAgo(m.createdAt)}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-all -mr-1" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}
