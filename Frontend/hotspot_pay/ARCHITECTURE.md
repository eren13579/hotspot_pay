# HotspotPay — Architecture du Frontend React

> **Projet** : `hotspotpay-frontend` · **Port** : `5173` · **React 19** · **Vite 6** · **pnpm workspace**

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Structure du projet](#3-structure-du-projet)
4. [Architecture des données](#4-architecture-des-données)
5. [Système de routing](#5-système-de-routing)
6. [Authentification](#6-authentification)
7. [Composants](#7-composants)
8. [Temps réel (SSE)](#8-temps-réel-sse)
9. [Design system](#9-design-system)
10. [Internationalisation](#10-internationalisation)
11. [Pages clés](#11-pages-clés)

---

## 1. Vue d'ensemble

Interface d'administration SaaS pour les opérateurs de hotspots WiFi HotspotPay. Accessible via `https://hotspotpay.app` (production) ou `http://localhost:5173` (développement).

### Fonctionnalités principales

- **Portail captif public** : page de connexion WiFi avec paiement Mobile Money
- **Dashboard opérateur** : vue d'ensemble des revenus, hotspots, sessions
- **Gestion des hotspots** : CRUD, configuration routeur, token, script MikroTik
- **Forfaits & Tickets** : création de forfaits, import de codes prépayés
- **Paiements & Sessions** : historique, suivi en temps réel
- **Administration** : utilisateurs, marques de routeurs, paramètres système
- **Abonnements** : plans opérateurs, intégration Moneroo

### Flux de navigation

```
                    ┌──────────────────────────┐
                    │  Landing Page (/)        │  ← Pages publiques
                    │  À propos (/about)       │
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                                     ▼
    ┌──────────────────┐                 ┌──────────────────┐
    │  Login (/sign-in) │                 │ Portal Captif    │
    │  Register (/sign-up)│               │ (/portal/:id)    │
    └────────┬─────────┘                 └──────────────────┘
             │ Auth OK
             ▼
    ┌─────────────────────────────────────────────┐
    │          DashboardLayout                    │
    │  ┌─────────┬──────────┬──────────┬──────┐  │
    │  │Dashboard│ Hotspots │ Tickets  │ ...  │  │
    │  └─────────┴──────────┴──────────┴──────┘  │
    └─────────────────────────────────────────────┘
```

---

## 2. Stack technique

| Catégorie | Technologie | Usage |
|-----------|-------------|-------|
| **Framework** | React 19 | UI components (Concurrent features) |
| **Langage** | JavaScript (JSX) | Pas de TypeScript |
| **Build** | Vite 6 | Dev server + production build |
| **Routing** | React Router DOM 7 | Navigation multi-niveaux |
| **État global** | Redux Toolkit (2 slices) | Auth + UI state |
| **HTTP** | Axios | Client API + intercepteurs JWT |
| **CSS** | Tailwind CSS 4 | Utility-first + design system |
| **Icônes** | Lucide React | Icônes cohérentes |
| **Graphiques** | Recharts | Dashboard charts |
| **Animations** | Framer Motion 12 | Transitions page, sidebar, toasts |
| **Notifications** | Sonner | Toasts modernes |
| **PDF** | jsPDF + autotable | Factures, rapports |
| **QR Codes** | qrcode.react | Génération QR |

---

## 3. Structure du projet

```
src/
├── main.jsx                       # Entry point (Redux Provider + Router)
├── App.jsx                        # Routes + Layout principal
├── index.css                      # Tailwind 4 + thème personnalisé
│
├── api/
│   ├── axios.js                   # Axios instance + intercepteurs JWT
│   ├── publicAxios.js             # Axios instance publique (sans auth)
│   ├── auth.js                    # Endpoints d'authentification
│   └── endpoints.js               # Tous les endpoints API par domaine
│
├── store/
│   ├── store.js                   # Configuration Redux store
│   ├── authSlice.js               # Auth state + async thunks
│   └── uiSlice.js                 # UI state (sidebar, thème, recherche)
│
├── context/
│   └── PublicSettingsContext.jsx   # Contexte global des paramètres
│                                  # (portail captif, SSE, thème)
│
├── hooks/
│   ├── useAuth.js                 # Authentification (login, register, logout)
│   ├── usePlan.js                  # Plan/abonnement utilisateur
│   ├── useAdminNotifications.js    # Notifications admin
│   └── useSystemSse.js            # Connexion SSE temps réel
│
├── utils/
│   ├── cn.js                      # Fusion de classes Tailwind (clsx)
│   ├── format.js                  # Formatage dates (FR/EN), monnaie
│   └── slug.js                    # Génération de slugs
│
├── pages/
│   ├── landing/
│   │   ├── LandingPage.jsx        # Page d'accueil publique
│   │   └── AboutPage.jsx          # Page À propos
│   │
│   ├── auth/
│   │   ├── LoginPage.jsx          # Connexion (email + Google + 2FA)
│   │   └── RegisterPage.jsx       # Inscription
│   │
│   ├── onboarding/
│   │   └── OnboardingPage.jsx     # Premier démarrage (création hotspot)
│   │
│   ├── dashboard/
│   │   ├── DashboardPage.jsx          # Vue d'ensemble
│   │   ├── HotspotsPage.jsx           # Gestion hotspots
│   │   ├── HotspotDetailPage.jsx      # Détail hotspot
│   │   ├── TicketsPage.jsx            # Tickets prépayés
│   │   ├── SessionsPage.jsx           # Sessions actives
│   │   ├── PaymentsPage.jsx           # Historique paiements
│   │   ├── WithdrawalsPage.jsx        # Retraits
│   │   ├── SubscriptionsPage.jsx      # Abonnements
│   │   ├── SettingsPage.jsx           # Paramètres opérateur
│   │   ├── ProfilePage.jsx            # Profil + 2FA TOTP
│   │   ├── SupportPage.jsx            # Support / Contact
│   │   ├── NotificationsPage.jsx      # Notifications
│   │   └── admin/                     # Pages ADMIN
│   │       ├── AdminDashboardPage.jsx      # Dashboard admin
│   │       ├── AdminUsersPage.jsx          # Gestion utilisateurs
│   │       ├── AdminHotspotsPage.jsx       # Tous les hotspots
│   │       ├── AdminTicketsPage.jsx        # Tous les tickets
│   │       ├── AdminRouterBrandsPage.jsx   # Marques de routeurs
│   │       ├── AdminSettingsPage.jsx       # Paramètres système
│   │       ├── AdminFaqPage.jsx            # FAQ
│   │       └── AdminMonitorPage.jsx        # Monitoring
│   │
│   └── portal/
│       └── PortalPage.jsx          # Portail captif (public + paramétrable)
│
├── components/
│   ├── ui/                         # Primitives réutilisables
│   │   ├── Modal.jsx               # Fenêtre modale
│   │   ├── ConfirmDialog.jsx       # Dialogue de confirmation
│   │   ├── Alert.jsx               # Alerte
│   │   ├── Badge.jsx               # Badge de statut
│   │   ├── Spinner.jsx             # Loader
│   │   ├── EmptyState.jsx          # État vide
│   │   ├── StatCard.jsx            # Carte statistique
│   │   ├── Toggle.jsx              # Interrupteur
│   │   ├── CodeBlock.jsx           # Bloc de code
│   │   └── DataTable.jsx           # Tableau de données
│   │
│   ├── layout/
│   │   ├── DashboardLayout.jsx     # Layout principal (sidebar + navbar)
│   │   ├── Sidebar.jsx             # Navigation latérale
│   │   ├── Navbar.jsx              # Barre supérieure
│   │   └── ProtectedRoute.jsx      # Garde d'authentification
│   │
│   ├── auth/
│   │   ├── LeftPanel.jsx           # Panneau gauche (visuel/brand)
│   │   ├── AuthLoader.jsx          # Loader auth
│   │   └── TwoFactorForm.jsx       # Formulaire 2FA
│   │
│   ├── dashboard/
│   │   ├── OverviewCards.jsx       # Cartes récapitulatives
│   │   ├── RevenueChart.jsx        # Graphique revenus
│   │   ├── HotspotStatusGrid.jsx   # Grille statut hotspots
│   │   └── RecentPayments.jsx      # Paiements récents
│   │
│   ├── hotspots/
│   │   ├── HotspotCard.jsx         # Carte hotspot
│   │   ├── RouterTokenPanel.jsx    # Configuration token routeur
│   │   └── ScriptDownload.jsx      # Téléchargement script
│   │
│   ├── payments/
│   │   ├── PaymentRow.jsx          # Ligne de paiement
│   │   ├── PaymentStatusBadge.jsx  # Badge statut
│   │   └── PaymentFilters.jsx      # Filtres
│   │
│   ├── sessions/
│   │   └── SessionRow.jsx          # Ligne de session
│   │
│   ├── tickets/
│   │   ├── TicketRow.jsx           # Ligne de ticket
│   │   ├── TicketCSVUploader.jsx   # Import CSV
│   │   └── TicketGenerator.jsx     # Génération de tickets
│   │
│   ├── settings/
│   │   ├── ProfileForm.jsx         # Formulaire profil
│   │   ├── SecuritySettings.jsx    # Paramètres sécurité
│   │   ├── NotificationPrefs.jsx   # Préférences notifications
│   │   ├── ApiKeysTab.jsx          # Gestion clés API
│   │   └── TeamMembers.jsx         # Gestion équipe
│   │
│   ├── subscriptions/
│   │   └── SubscriptionCard.jsx    # Carte d'abonnement
│   │
│   ├── withdrawals/
│   │   └── WithdrawalRow.jsx       # Ligne de retrait
│   │
│   ├── portal/
│   │   ├── PortalHeader.jsx        # Header du portail captif
│   │   ├── PlanSelection.jsx       # Sélection forfait
│   │   ├── PaymentMethods.jsx      # Moyens de paiement
│   │   └── ConnectionStatus.jsx    # Statut connexion
│   │
│   ├── landing/
│   │   ├── HeroSection.jsx         # Section hero
│   │   ├── FeaturesSection.jsx     # Fonctionnalités
│   │   └── CTASection.jsx          # Appel à l'action
│   │
│   └── onboarding/
│       ├── WelcomeStep.jsx         # Étape bienvenue
│       ├── HotspotSetupStep.jsx    # Configuration hotspot
│       └── PaymentSetupStep.jsx    # Configuration paiement
│
└── assets/
    ├── images/                     # Images (backgrounds, illustrations)
    └── logos/                      # Logos partenaires (MTN, Orange, etc.)
```

---

## 4. Architecture des données

### Principe : Redux pour l'UI, pas de cache serveur

Contrairement à une approche React Query, ce frontend utilise **Redux pour tout** :

```
┌──────────────────────────────────────────────────┐
│                   Application                     │
├────────────────────┬─────────────────────────────┤
│   Redux Store      │    React Context             │
│                    │                              │
│  authSlice         │  PublicSettingsContext       │
│  ├─ user           │  ├─ logo, favicon            │
│  ├─ accessToken    │  ├─ portal config            │
│  ├─ refreshToken   │  ├─ SSE connection           │
│  ├─ role           │  └─ system settings          │
│  ├─ 2FA state      │                              │
│  └─ loading/error  │                              │
│                    │                              │
│  uiSlice           │                              │
│  ├─ sidebar        │                              │
│  ├─ theme          │                              │
│  ├─ locale (FR/EN) │                              │
│  └─ searchQuery    │                              │
└────────────────────┴──────────────────────────────┘
```

### Pattern de fetch

Chaque page appelle directement les endpoints via Axios :

```javascript
// Exemple : DashboardPage.jsx
const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  api.get('/dashboard/overview')
    .then(res => setStats(res.data))
    .finally(() => setLoading(false));
}, []);
```

---

## 5. Système de routing

### Configuration (`App.jsx`)

```jsx
<BrowserRouter>
  <Routes>
    {/* Pages publiques */}
    <Route path="/" element={<LandingPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/portal/:hotspotId" element={<PortalPage />} />

    {/* Auth */}
    <Route path="/sign-in" element={<LoginPage />} />
    <Route path="/sign-up" element={<RegisterPage />} />
    <Route path="/onboarding" element={<OnboardingPage />} />

    {/* Dashboard protégé */}
    <Route path="/dashboard" element={<ProtectedRoute />}>
      <Route element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="hotspots" element={<HotspotsPage />} />
        <Route path="hotspots/:id" element={<HotspotDetailPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="withdrawals" element={<WithdrawalsPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Routes Admin */}
        <Route path="admin" element={<AdminDashboardPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/hotspots" element={<AdminHotspotsPage />} />
        <Route path="admin/tickets" element={<AdminTicketsPage />} />
        <Route path="admin/brands" element={<AdminRouterBrandsPage />} />
        <Route path="admin/settings" element={<AdminSettingsPage />} />
        <Route path="admin/faq" element={<AdminFaqPage />} />
        <Route path="admin/monitoring" element={<AdminMonitorPage />} />
      </Route>
    </Route>
  </Routes>
</BrowserRouter>
```

### Structure des routes

| Route | Visibilité | Layout |
|-------|-----------|--------|
| `/` | Public | — |
| `/about` | Public | — |
| `/portal/:hotspotId` | Public | Portail |
| `/sign-in` | Guest | Auth |
| `/sign-up` | Guest | Auth |
| `/onboarding` | Auth | — |
| `/dashboard/*` | Auth | DashboardLayout |
| `/dashboard/admin/*` | Auth + ADMIN | DashboardLayout |

### `ProtectedRoute`

Vérifie la présence du token JWT dans le store Redux + localStorage. Redirige vers `/sign-in` si absent.

---

## 6. Authentification

### Flux JWT

```
1. POST /api/V1/auth/login
   → { success, data: { accessToken, refreshToken, user } }

2. Stockage Redux
   → authSlice : user, accessToken, refreshToken
   → localStorage : 'accessToken', 'refreshToken', 'user'

3. Chaque requête
   → Intercepteur Axios ajoute Authorization: Bearer <token>

4. Token expiré (401)
   → Intercepteur : POST /api/V1/auth/refresh → nouveau token
   → Si refresh échoue : logout + redirection /sign-in
```

### Intercepteur Axios (`api/axios.js`)

```javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await axios.post('/api/V1/auth/refresh', { refreshToken });
      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(error.config);
      }
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);
```

### 2FA (TOTP)

L'authentification à deux facteurs est intégrée :
1. Login → si 2FA activé → `tempToken` stocké
2. Affichage formulaire TOTP à 6 chiffres
3. Validation → `accessToken` final

---

## 7. Composants

### Design System (`components/ui/`)

Tous les composants sont en JavaScript, utilisent Tailwind CSS 4 avec `cn()` pour la fusion de classes :

```jsx
// Exemple : Badge.jsx
export function Badge({ children, variant = 'default', className }) {
  const variants = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    default: 'bg-slate-700 text-slate-300 border-slate-600',
  };
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
```

### États systématiques

Chaque page gère les 4 états :

| État | Affichage | Composant |
|------|-----------|-----------|
| **Loading** | Spinner centré | `<Spinner />` |
| **Error** | Message d'erreur | `<Alert type="error" />` |
| **Empty** | Illustration + message | `<EmptyState>` |
| **Success** | Données | Composant métier |

---

## 8. Temps réel (SSE)

Le frontend utilise **Server-Sent Events** via un contexte partagé :

### `PublicSettingsContext.jsx`

```javascript
// Connexion SSE automatique après login
const setupSSE = (userId) => {
  const token = localStorage.getItem('accessToken');
  const eventSource = new EventSource(
    `/api/V1/sse/subscribe/${userId}?token=${token}`
  );

  eventSource.addEventListener('payment.status', (e) => {
    const data = JSON.parse(e.data);
    toast.success(`Paiement ${data.status}`);
    refreshDashboard();
  });

  eventSource.addEventListener('session.activated', (e) => {
    toast.success('Session activée');
    refreshSessions();
  });
};
```

### Événements SSE

| Événement | Déclencheur | Action UI |
|-----------|------------|-----------|
| `payment.status` | Paiement confirmé | Toast + refresh dashboard |
| `session.activated` | Session WiFi activée | Toast + refresh sessions |
| `session.expired` | Session terminée | Refresh automatique |
| `router.status` | Routeur online/offline | Mise à jour badge statut |
| `system.notification` | Notification admin | Toast + notification bell |

---

## 9. Design system

### Palette de couleurs

```
Ambre (CTA, revenus, premium) :
  amber-400 → amber-600 : #FBBF24 → #D97706

Bleu (navigation, sections info, badges) :
  blue-400 → blue-600   : #60A5FA → #2563EB

Surfaces (dark theme principal) :
  slate-800  : #1E293B    (sidebar, cards)
  slate-900  : #0F172A    (fond principal)
  slate-950  : #020617    (fond profond)

Succès/Erreur/Avertissement :
  green-400  : #4ADE80
  red-400    : #F87171
  amber-400  : #FBBF24
```

### Typographie

| Usage | Police |
|-------|--------|
| Titres display | **Calistoga** (serif) |
| Corps | **Inter** (sans-serif) |
| Code/Monospace | **JetBrains Mono** |

### Animations (Framer Motion)

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {children}
</motion.div>
```

- Sidebar : slide latéral
- Pages : fade + slide up
- Modales : scale + fade
- Toasts : Sonner (animations intégrées)

---

## 10. Internationalisation

Support **Français / Anglais** via le store Redux :

```javascript
// uiSlice.js
locale: 'fr',  // ou 'en'

// format.js
export function formatDate(date, locale = 'fr') {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}
```

---

## 11. Pages clés

### Dashboard opérateur

| Page | URL | Fonctionnalité |
|------|-----|---------------|
| Dashboard | `/dashboard` | Stats globales, graphiques revenus, hotspots actifs |
| Hotspots | `/dashboard/hotspots` | CRUD + détail + token + script |
| Tickets | `/dashboard/tickets` | Import CSV, activation, génération |
| Sessions | `/dashboard/sessions` | Liste + révocation |
| Paiements | `/dashboard/payments` | Historique + filtres |
| Retraits | `/dashboard/withdrawals` | Demandes de retrait |
| Abonnements | `/dashboard/subscriptions` | Plans opérateur |
| Profil | `/dashboard/profile` | Données perso + 2FA TOTP |
| Support | `/dashboard/support` | FAQ + contact |

### Pages admin

| Page | URL | Fonctionnalité |
|------|-----|---------------|
| Dashboard Admin | `/dashboard/admin` | Stats globales système |
| Utilisateurs | `/dashboard/admin/users` | CRUD + rôles |
| Hotspots | `/dashboard/admin/hotspots` | Scope global |
| Tickets | `/dashboard/admin/tickets` | Tous les tickets |
| Marques routeurs | `/dashboard/admin/brands` | CRUD marques + modèles |
| Paramètres | `/dashboard/admin/settings` | Système (logo, favicon, paiements, etc.) |
| FAQ | `/dashboard/admin/faq` | FAQ éditable |
| Monitoring | `/dashboard/admin/monitoring` | Queue routeur, santé |

### Pages publiques

| Page | URL | Fonctionnalité |
|------|-----|---------------|
| Landing | `/` | Présentation produit + CTA |
| À propos | `/about` | Informations plateforme |
| Portail captif | `/portal/:hotspotId` | Sélection forfait + paiement |

---

> **Documentation générée le 25 juin 2026** — Projet HotspotPay, version Frontend (pnpm workspace)
