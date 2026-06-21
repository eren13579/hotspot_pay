import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  HelpCircle, ChevronDown, Mail, MessageCircle, BookOpen,
  Wifi, CreditCard, Download, Tag, Repeat, Settings, ExternalLink,
  Search, LifeBuoy,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'

/* ─── Données FAQ ─────────────────────────────────────────── */
const FAQ_CATEGORIES = [
  {
    id: 'getting-started',
    label: 'Démarrage',
    icon: Wifi,
    items: [
      {
        q: 'Comment créer un hotspot ?',
        a: 'Rendez-vous dans Hotspots > Ajouter. Renseignez le nom, la localisation, et sélectionnez votre marque de routeur. Une fois créé, un token de configuration sera généré. Utilisez ce token pour configurer votre routeur MikroTik via le script de configuration automatique.',
      },
      {
        q: 'Comment configurer mon routeur MikroTik ?',
        a: 'Dans le détail de votre hotspot, cliquez sur "Télécharger le script". Importez-le dans votre routeur via WinBox ou SSH. Le script configure automatiquement le portail captif, les règles de pare-feu et les paramètres de bande passante.',
      },
      {
        q: 'Que faire si mon token de routeur est compromis ?',
        a: 'Allez dans le détail de votre hotspot et utilisez "Révoquer le token". Un nouveau token sera généré. Mettez à jour votre routeur avec le nouveau script de configuration.',
      },
      {
        q: 'Quels routeurs sont supportés ?',
        a: 'HotspotPay supporte les routeurs MikroTik (RouterOS v6 et v7). D\'autres marques seront ajoutées prochainement. Consultez la section Marques routeurs pour la liste complète.',
      },
    ],
  },
  {
    id: 'payments',
    label: 'Paiements',
    icon: CreditCard,
    items: [
      {
        q: 'Quels moyens de paiement sont acceptés ?',
        a: 'Les clients peuvent payer via Mobile Money : MTN Mobile Money, Orange Money, Moov Money et CamPay. Le paiement par carte bancaire sera disponible prochainement.',
      },
      {
        q: 'Comment fonctionne le paiement sur le portail captif ?',
        a: 'Lorsqu\'un client se connecte au WiFi, il est redirigé vers le portail captif HotspotPay. Il choisit un forfait, sélectionne son opérateur Mobile Money, et effectue le paiement. L\'accès internet est activé automatiquement dès la confirmation du paiement.',
      },
      {
        q: 'Un client a payé mais n\'a pas accès à internet, que faire ?',
        a: 'Vérifiez le statut du paiement dans la section Paiements de votre dashboard. Si le statut est "SUCCESS" mais que l\'activation a échoué, utilisez le bouton "Vérifier le statut" sur le paiement concerné. Si le problème persiste, contactez le support.',
      },
      {
        q: 'Puis-je rembourser un client ?',
        a: 'Oui, les administrateurs peuvent rembourser un paiement depuis la page Paiements (admin). Le remboursement est traité via l\'opérateur Mobile Money. Les délais varient selon l\'opérateur (24h à 72h).',
      },
    ],
  },
  {
    id: 'withdrawals',
    label: 'Retraits',
    icon: Download,
    items: [
      {
        q: 'Comment retirer mes revenus ?',
        a: 'Allez dans la section Retraits de votre dashboard. Cliquez sur "Nouveau retrait", indiquez le montant et votre numéro Mobile Money. La demande sera traitée par l\'administration sous 24h à 48h.',
      },
      {
        q: 'Quels sont les délais de traitement ?',
        a: 'Les retraits sont traités sous 24h à 48h ouvrées. Les demandes faites le week-end sont traitées le lundi suivant. Vous recevrez une notification dès que votre retrait sera approuvé ou rejeté.',
      },
      {
        q: 'Y a-t-il des frais de retrait ?',
        a: 'Les frais dépendent de votre plan d\'abonnement. Les utilisateurs Standard paient 2% du montant, les PRO 1%, et les PREMIUM 0%. Consultez la page Abonnements pour plus de détails.',
      },
      {
        q: 'Pourquoi mon retrait a été rejeté ?',
        a: 'Les motifs de rejet peuvent inclure : solde insuffisant après vérification, numéro Mobile Money invalide, ou dépassement de la limite mensuelle. Contactez le support pour plus d\'informations.',
      },
    ],
  },
  {
    id: 'plans-tickets',
    label: 'Forfaits & Tickets',
    icon: Tag,
    items: [
      {
        q: 'Comment créer un forfait WiFi ?',
        a: 'Dans la section Forfaits, cliquez sur "Ajouter un forfait". Définissez le nom, la durée (30 min, 1h, 24h, etc.), le prix, et la bande passante allouée. Vous pouvez également définir un profil de limitation (vitesse max, quota).',
      },
      {
        q: 'Comment importer des tickets prépayés ?',
        a: 'Dans la section Tickets, utilisez l\'option "Importer". Vous pouvez importer un fichier CSV avec les codes tickets ou générer des tickets en masse. Chaque ticket a un code unique que le client peut utiliser sur le portail captif.',
      },
      {
        q: 'Les forfaits peuvent-ils être modifiés après création ?',
        a: 'Oui, vous pouvez modifier le prix, la durée et la bande passante d\'un forfait existant. Les modifications s\'appliquent aux nouveaux achats uniquement. Pour désactiver un forfait, utilisez le bouton "Toggle" dans la liste.',
      },
    ],
  },
  {
    id: 'subscriptions',
    label: 'Abonnements',
    icon: Repeat,
    items: [
      {
        q: 'Quels sont les plans disponibles ?',
        a: 'Trois plans : Standard (gratuit, 1 hotspot, 50 tickets), PRO (5 000 XAF/mois, hotspots illimités, tickets illimités, support prioritaire), et PREMIUM (15 000 XAF/mois, toutes les fonctionnalités, API, support dédié, retraits sans frais).',
      },
      {
        q: 'Comment changer de plan ?',
        a: 'Allez dans la section Abonnements > Plans. Choisissez le plan souhaité et suivez la procédure de paiement. Le nouveau plan est actif immédiatement après confirmation du paiement.',
      },
      {
        q: 'Que se passe-t-il si mon abonnement expire ?',
        a: 'Votre compte est rétrogradé au plan Standard. Vous conservez vos hotspots mais les fonctionnalités PRO/PREMIUM sont désactivées. Les revenus en attente de retrait restent disponibles.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    label: 'Dépannage',
    icon: Settings,
    items: [
      {
        q: 'Mon hotspot est hors ligne, que faire ?',
        a: 'Vérifiez que votre routeur est allumé et connecté à internet. Dans le dashboard, vérifiez le statut du hotspot. Si le token est expiré ou révoqué, générez-en un nouveau et mettez à jour la configuration du routeur.',
      },
      {
        q: 'Les clients signalent que le portail captif ne s\'affiche pas',
        a: 'Vérifiez que le DNS du routeur redirige bien toutes les requêtes vers le portail. Assurez-vous que le hotspot est actif dans votre dashboard. Testez le portail en cliquant sur "Tester" dans le détail du hotspot.',
      },
      {
        q: 'Une erreur 500 apparaît, que faire ?',
        a: 'Les erreurs 500 peuvent être temporaires. Rafraîchissez la page et réessayez. Si le problème persiste, vérifiez que les services backend sont en ligne. Contactez le support si nécessaire.',
      },
    ],
  },
]

const CONTACT_OPTIONS = [
  { icon: Mail, label: 'Email', value: 'support@hotspotpay.cm', href: 'mailto:support@hotspotpay.cm' },
  { icon: MessageCircle, label: 'WhatsApp', value: '+237 6XX XXX XXX', href: 'https://wa.me/2376XXXXXXXX' },
  { icon: BookOpen, label: 'Documentation', value: 'Guide complet en ligne', href: '/docs' },
]

/* ─── Accordion Item ──────────────────────────────────────── */
function AccordionItem({ q, a, isOpen, onToggle, isLight }) {
  return (
    <div className={cn('border-b', isLight ? 'border-slate-200' : 'border-slate-800')}>
      <button onClick={onToggle}
        className={cn('flex items-center justify-between w-full px-4 py-3.5 text-left transition-all cursor-pointer',
          isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30')}>
        <span className={cn('text-xs font-medium', isLight ? 'text-slate-800' : 'text-slate-200')}>{q}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 ml-2 transition-transform duration-200', isOpen && 'rotate-180',
          isLight ? 'text-slate-400' : 'text-slate-500')} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key="content" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className={cn('px-4 pb-4 text-[11px] leading-relaxed', isLight ? 'text-slate-600' : 'text-slate-400')}>
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ════════════════════════════════════════════════════════════ */
export default function SupportPage() {
  const theme = useSelector(state => state.ui.theme)
  const isLight = theme === 'light'
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  const cardCls = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'

  const [activeCat, setActiveCat] = useState('getting-started')
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState(new Set())

  const toggleItem = (key) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Filtre par catégorie + recherche
  const categories = useMemo(() => {
    if (!searchQuery) return FAQ_CATEGORIES
    const q = searchQuery.toLowerCase()
    return FAQ_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)),
    })).filter(cat => cat.items.length > 0)
  }, [searchQuery])

  const activeCategory = categories.find(c => c.id === activeCat) || categories[0]
  const totalResults = categories.reduce((sum, c) => sum + c.items.length, 0)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', isLight ? 'bg-sky-50 text-sky-600' : 'bg-sky-500/10 text-sky-400')}>
          <LifeBuoy className="w-5 h-5" />
        </div>
        <div>
          <h1 className={cn('text-xl font-black tracking-tight', textPrimary)}>Aide & Support</h1>
          <p className={cn('text-[11px]', textSecondary)}>Trouvez rapidement une réponse à vos questions</p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border', isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800')}>
        <Search className={cn('w-4 h-4', textMuted)} />
        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher dans la FAQ..."
          className={cn('flex-1 bg-transparent outline-none text-xs', textPrimary, 'placeholder:text-slate-500')} />
        {searchQuery && (
          <span className={cn('text-[10px]', textMuted)}>{totalResults} résultat{totalResults !== 1 ? 's' : ''}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Sidebar catégories ── */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className={cn('rounded-2xl overflow-hidden border', isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800')}>
            {categories.map(cat => {
              const active = activeCat === cat.id
              return (
                <button key={cat.id} onClick={() => { setActiveCat(cat.id); setOpenItems(new Set()) }}
                  className={cn('flex items-center gap-3 w-full px-4 py-3 text-left transition-all cursor-pointer border-b',
                    isLight ? 'border-slate-100' : 'border-slate-800',
                    active ? (isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400') : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30'))}>
                  <cat.icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-medium">{cat.label}</span>
                  <span className={cn('ml-auto text-[10px]', textMuted)}>{cat.items.length}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── FAQ Content ── */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <motion.div key={activeCat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-2xl overflow-hidden border', cardCls)}>
            <div className={cn('px-4 py-3 border-b font-bold text-xs', isLight ? 'border-slate-200 text-slate-800' : 'border-slate-800 text-white')}>
              {activeCategory.label}
            </div>
            {activeCategory.items.length > 0 ? (
              activeCategory.items.map((item, i) => {
                const key = `${activeCat}-${i}`
                return (
                  <AccordionItem key={key} q={item.q} a={item.a}
                    isOpen={openItems.has(key)} onToggle={() => toggleItem(key)}
                    isLight={isLight} />
                )
              })
            ) : (
              <div className="p-6 text-center">
                <HelpCircle className={cn('w-8 h-8 mx-auto mb-2', textMuted)} />
                <p className={cn('text-xs', textSecondary)}>Aucun résultat trouvé. Essayez d\'autres mots-clés.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Contact sidebar ── */}
        <div className="lg:col-span-1 order-3">
          <div className={cn('rounded-2xl border p-4 space-y-3', cardCls)}>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className={cn('w-4 h-4', textPrimary)} />
              <h3 className={cn('text-xs font-bold', textPrimary)}>Nous contacter</h3>
            </div>
            {CONTACT_OPTIONS.map(opt => (
              <a key={opt.label} href={opt.href} target="_blank" rel="noopener noreferrer"
                className={cn('flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer',
                  isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/30')}>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400')}>
                  <opt.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[10px] font-medium', textPrimary)}>{opt.label}</p>
                  <p className={cn('text-[10px] truncate', textMuted)}>{opt.value}</p>
                </div>
                <ExternalLink className={cn('w-3 h-3 shrink-0', textMuted)} />
              </a>
            ))}
          </div>

          {/* Status */}
          <div className={cn('rounded-2xl border p-4 mt-3 space-y-2', cardCls)}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className={cn('text-[10px] font-medium', textPrimary)}>Tous les systèmes opérationnels</span>
            </div>
            <p className={cn('text-[10px]', textMuted)}>
              Temps de réponse estimé : <strong>2-4h</strong> ouvrées
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
