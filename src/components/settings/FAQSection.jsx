import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Plus, Edit2, Trash2, MessageCircle, Search, X, Check, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import { faqApi } from '../../api/endpoints'
import SectionCard from './SectionCard'

const CATEGORIES = [
  { id: 'getting-started', label: 'Démarrage' },
  { id: 'payments',        label: 'Paiements' },
  { id: 'withdrawals',     label: 'Retraits' },
  { id: 'plans-tickets',   label: 'Forfaits & Tickets' },
  { id: 'subscriptions',   label: 'Abonnements' },
  { id: 'troubleshooting', label: 'Dépannage' },
]

const emptyForm = () => ({
  question: '',
  answer: '',
  category: 'getting-started',
  sortOrder: 0,
  isActive: true,
})

export default function FAQSection() {
  const theme = useSelector(state => state.ui.theme)
  const isLight = theme === 'light'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const cardCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'
  const inputCls = isLight
    ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
    : 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500'

  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [filterCat, setFilterCat] = useState('all')

  const fetchFaqs = () => {
    setLoading(true)
    setError(null)
    faqApi.adminList()
      .then(({ data }) => setFaqs(data.data || []))
      .catch(err => setError(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchFaqs() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  const openEdit = (faq) => {
    setEditingId(faq.id)
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sortOrder: faq.sortOrder,
      isActive: faq.isActive,
    })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.question.trim() || !form.answer.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await faqApi.update(editingId, form)
      } else {
        await faqApi.create(form)
      }
      closeForm()
      fetchFaqs()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette FAQ ?')) return
    try {
      await faqApi.delete(id)
      fetchFaqs()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de suppression')
    }
  }

  const handleToggleActive = async (faq) => {
    try {
      await faqApi.update(faq.id, {
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        sortOrder: faq.sortOrder,
        isActive: !faq.isActive,
      })
      fetchFaqs()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de mise à jour')
    }
  }

  // Filtre
  const filtered = faqs.filter(f => {
    if (filterCat !== 'all' && f.category !== filterCat) return false
    if (search) {
      const q = search.toLowerCase()
      return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <SectionCard icon={MessageCircle} title="FAQ" description="Gérez les questions/réponses de la page Aide & Support">
      {/* ── Erreur ── */}
      {error && (
        <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── Barre d'outils ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border flex-1 min-w-[160px]', isLight ? 'bg-white border-slate-200' : 'bg-slate-800/50 border-slate-700')}>
          <Search className={cn('w-3.5 h-3.5', textMuted)} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher dans la FAQ..."
            className={cn('flex-1 bg-transparent outline-none text-[11px]', textPrimary, 'placeholder:text-slate-500')} />
        </div>

        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className={cn('px-3 py-1.5 rounded-lg border text-[11px] outline-none appearance-none cursor-pointer',
            isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-800/50 border-slate-700 text-slate-300')}>
          <option value="all">Toutes les catégories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>

        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-medium transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>

      {/* ── Formulaire d'ajout/édition ── */}
      {formOpen && (
        <form onSubmit={handleSubmit} className={cn('rounded-xl border p-4 space-y-3', isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/30 border-slate-700')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <label className={cn('text-[11px] font-medium', textPrimary)}>Question</label>
              <input type="text" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })}
                className={cn('w-full px-3 py-2 rounded-lg border text-xs outline-none', inputCls)}
                placeholder="Comment créer un hotspot ?" required />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className={cn('text-[11px] font-medium', textPrimary)}>Réponse</label>
              <textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })}
                className={cn('w-full px-3 py-2 rounded-lg border text-xs outline-none resize-y min-h-[80px]', inputCls)}
                placeholder="Rendez-vous dans Hotspots..." required rows={4} />
            </div>
            <div className="space-y-1.5">
              <label className={cn('text-[11px] font-medium', textPrimary)}>Catégorie</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className={cn('w-full px-3 py-2 rounded-lg border text-xs outline-none', inputCls)}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={cn('text-[11px] font-medium', textPrimary)}>Ordre d'affichage</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className={cn('w-full px-3 py-2 rounded-lg border text-xs outline-none', inputCls)} min={0} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-slate-600 accent-amber-500" />
              <span className={cn('text-[11px]', textSecondary)}>Active</span>
            </label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={closeForm}
                className={cn('px-3 py-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors', isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-100' : 'border-slate-700 text-slate-400 hover:bg-slate-800')}>
                Annuler
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer">
                {saving ? 'Enregistrement...' : editingId ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className={cn('h-12 rounded-xl animate-pulse', isLight ? 'bg-slate-100' : 'bg-slate-800/30')} />
          ))}
        </div>
      )}

      {/* ── Liste des FAQs ── */}
      {!loading && (
        <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center">
              <MessageCircle className={cn('w-6 h-6 mx-auto mb-2', textMuted)} />
              <p className={cn('text-[11px]', textSecondary)}>
                {search || filterCat !== 'all' ? 'Aucun résultat trouvé' : 'Aucune FAQ pour le moment. Cliquez sur "Ajouter" pour en créer une.'}
              </p>
            </div>
          ) : filtered.map(faq => (
            <div key={faq.id} className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border transition-all group',
              isLight ? 'bg-white border-slate-100 hover:border-slate-200' : 'bg-slate-800/20 border-slate-800 hover:border-slate-700')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-medium truncate', textPrimary)}>{faq.question}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded', isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-500')}>
                    {CATEGORIES.find(c => c.id === faq.category)?.label || faq.category}
                  </span>
                  {!faq.isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">Inactive</span>
                  )}
                </div>
                <p className={cn('text-[11px] truncate', textMuted)}>{faq.answer}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleToggleActive(faq)}
                  className={cn('p-1.5 rounded-lg cursor-pointer transition-colors',
                    isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-700 text-slate-500')}
                  title={faq.isActive ? 'Désactiver' : 'Activer'}>
                  {faq.isActive ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => openEdit(faq)}
                  className={cn('p-1.5 rounded-lg cursor-pointer transition-colors',
                    isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-700 text-slate-500')}
                  title="Modifier">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(faq.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 cursor-pointer transition-colors"
                  title="Supprimer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Compteur ── */}
      {!loading && faqs.length > 0 && (
        <p className={cn('text-[10px] text-right', textMuted)}>
          {filtered.length} / {faqs.length} FAQ{faqs.length > 1 ? 's' : ''}
          {filterCat !== 'all' || search ? ' filtrée(s)' : ''}
        </p>
      )}
    </SectionCard>
  )
}
