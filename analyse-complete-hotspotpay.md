# Analyse Complète — Projet HotspotPay

**Date :** 21 juin 2026  
**Projets analysés :** Backend Java, Backend FastAPI, Frontend React  
**Analyse générée par :** Claude Code (Opus 4.8)

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture globale](#2-architecture-globale)
3. [Backend Java/Spring Boot](#3-backend-javaspring-boot)
4. [Backend FastAPI](#4-backend-fastapi)
5. [Frontend React/Vite](#5-frontend-reactvite)
6. [Flux métier détaillés](#6-flux-métier-détaillés)
7. [Relations entre projets](#7-relations-entre-projets)
8. [Sécurité](#8-sécurité)
9. [Problèmes identifiés](#9-problèmes-identifiés)
10. [Recommandations](#10-recommandations)

---

## 1. Vue d'ensemble

**HotspotPay** est une plateforme SaaS de **portail captif WiFi** destinée au marché africain (Cameroun principalement). Elle permet aux propriétaires de hotspots WiFi de monétiser leur connexion en vendant des forfaits d'accès via **Mobile Money** (MTN MoMo, Orange Money, CamPay, Moneroo).

### Chiffres clés

| Métrique | Valeur |
|----------|--------|
| Langages | Java 21, Python 3.11+, JavaScript (React 19) |
| Fichiers source | ~300 fichiers |
| Estimation code | ~30 000+ lignes |
| API exposées | ~200+ endpoints REST |
| Bases de données | 1 PostgreSQL (partagée entre Java et FastAPI) + Redis |
| Passerelles paiement | 4 (MTN MoMo, Orange Money, CamPay, Moneroo) |
| Marques routeurs supportées | 5 (MikroTik, TP-Link, Huawei, Ubiquiti, Tenda) |
| Plans SaaS | 3 (STANDARD gratuit, PRO 1500 XAF/mois, PREMIUM 5000 XAF/mois) |

---

## 2. Architecture globale

```
┌────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                   │
└──┬─────────────────────────────────────────────────────────────┬───┘
   │                                                              │
   ▼                                                              ▼
┌──────────────────────┐                              ┌──────────────────────┐
│   CLIENT NAVIGATEUR   │                              │   ROUTEUR MIKROTIK   │
│   (Téléphone/client)  │                              │   (Long Polling)      │
│                       │                              │                      │
│   1. Arrive sur le    │                              │   Interroge toutes   │
│      portail captif   │                              │   les 5s FastAPI     │
│   2. Paie Mobile Money│                              │   pour les actions   │
│   3. Reçoit accès     │                              │                      │
└──────────┬───────────┘                              └──────────┬───────────┘
           │                                                      │
           │  HTTP (page portail, API)                            │ HTTPS (Long Poll)
           ▼                                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     PARTIE SERVEUR (Docker)                               │
│                                                                          │
│  ┌─────────────────────────┐        ┌──────────────────────────┐        │
│  │  FRONTEND React/Vite    │───────▶│  BACKEND Spring Boot     │        │
│  │  Port 5173 (dev)        │        │  Port 8080               │        │
│  │  Port 80 (prod)         │        │                          │        │
│  │                         │        │  - Auth (JWT/OAuth2)     │        │
│  │  - Dashboard gestion    │        │  - Paiements (4 gateways)│        │
│  │  - Landing page         │        │  - Portail captif        │        │
│  │  - Portail captif       │        │  - Notifications         │        │
│  │  - Onboarding           │        │  - Rate limiting         │        │
│  └─────────────────────────┘        └──────────┬───────────────┘        │
│                                                  │                        │
│                                                  │ Inter-service          │
│                                                  │ (API Key + HTTPS)     │
│                                                  ▼                        │
│                                        ┌──────────────────────────┐      │
│                                        │  BACKEND FastAPI         │      │
│                                        │  Port 8444               │      │
│                                        │                          │      │
│                                        │  - CRUD hotspots         │      │
│                                        │  - MikroTik actions queue│      │
│                                        │  - Dashboard stats       │      │
│                                        │  - Scripts routeurs      │      │
│                                        │  - Agent routier auto    │      │
│                                        └──────────────────────────┘      │
│                                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐                     │
│  │  PostgreSQL 16        │  │  Redis 7             │                     │
│  │  Port 5432            │  │  Port 6379           │                     │
│  │                       │  │                      │                     │
│  │  - hotspot_pay (Java) │  │  - Refresh tokens    │                     │
│  │  - hotspot_fastapi    │  │  - Cache (Spring)    │                     │
│  │    (FastAPI)          │  │  - Action queue      │                     │
│  └──────────────────────┘  │  - Rate limiting      │                     │
│                             │  - Idempotence locks  │                     │
│                             └──────────────────────┘                     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Principe de communication

```
Spring Boot (Java) ←→ FastAPI (Python) : Inter-service via HTTP avec API Key
FastAPI (Python)   ←→ MikroTik          : Long Polling HTTPS (20s timeout)
Spring Boot (Java) ←→ Opérateurs        : API REST + Webhooks
React (Frontend)   ←→ Spring Boot       : API REST JWT
React (Frontend)   ←→ FastAPI           : API REST publique (portail uniquement)
```

---

## 3. Backend Java/Spring Boot

### 3.1 Stack

| Composant | Technologie |
|-----------|-------------|
| Langage | Java 21 |
| Framework | Spring Boot 3.3.0 |
| Build | Maven |
| ORM | Hibernate (Spring Data JPA) |
| Base de données | PostgreSQL 16 |
| Migrations | Flyway (26 migrations) |
| Cache | Redis (Spring Cache + Lettuce) |
| Sécurité | Spring Security + JWT (jjwt 0.12.6) + Google OAuth2 |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Jobs | @Scheduled + Quartz (memory store) |
| Client HTTP | RestClient (Spring 6.1+) |
| Tests | Testcontainers, JUnit 5 |
| Mapping | Lombok (MapStruct présent mais peu utilisé) |
| Chiffrement | Jasypt 3.0.5 (mots de passe MikroTik) |
| Monitoring | Micrometer + Prometheus |

### 3.2 Modules (22 packages, 160 fichiers)

| Package | Responsabilité |
|---------|---------------|
| `auth` | Authentification JWT + OAuth2 Google (+ refresh tokens Redis) |
| `payment` | 4 passerelles Mobile Money, webhooks, routage intelligent |
| `portal` | Portail captif (page publique, paiement, SSE streaming) |
| `hotspot` | Proxy CRUD hotspots vers FastAPI |
| `plan` | Proxy CRUD forfaits WiFi vers FastAPI |
| `ticket` | CRUD tickets WiFi (import MikroTik) |
| `session` | Sessions WiFi actives/expirées |
| `subscription` | Abonnements SaaS (plans, souscription, historique) |
| `users` | Gestion utilisateurs (admin + user) |
| `withdrawal` | Retraits de revenus (demande, approbation/rejet) |
| `dashboard` | Statistiques et KPIs |
| `router` | Marques/modèles routeurs, callbacks inter-service |
| `audit` | Audit logging (toutes les actions utilisateur) |
| `notification` | Email (JavaMail) + SMS |
| `common` | DTO ApiResponse, exceptions, utilitaires |
| `config` | Configuration (Cache, Redis, Security, Swagger, etc.) |
| `scheduler` | 3 jobs : PaymentPolling (15s), SessionExpiry (60s), Cleanup (5min) |
| `monitoring` | Health check system |
| `systemsettings` | Paramètres dynamiques admin (8 sections) |
| `ratelimit` | Rate limiting par endpoint |
| `realtime` | SSE pour streaming statut paiement |
| `publicapi` | Paramètres publics (branding, landing page) |

### 3.3 API REST — Résumé par domaine

| Domaine | Nb endpoints | Dont admin |
|---------|:-----------:|:----------:|
| Authentification | 7 | 0 |
| Hotspots | 9 | 0 |
| Forfaits WiFi | 7 (proxy) | 0 |
| Paiements | 8 | 0 |
| Portail captif | 6 | 0 |
| Sessions | 6 | 0 |
| Tickets | 8 | 0 |
| Abonnements | 10 | 5 |
| Dashboard | 4 | 1 |
| Utilisateurs | 9 | 4 |
| Routeurs marques | 12 | 6 |
| Retraits | 5 | 0 |
| Paramètres admin | 4 | 4 |
| Script download | 1 | 0 |
| Callbacks internes | 2 | 0 |
| Public API | 1 | 0 |
| **Total** | **~100** | |

### 3.4 Paiements — Le cœur métier

Le système de paiement est le module le plus sophistiqué :

1. **Routage intelligent** — L'utilisateur choisit un opérateur (MTN/Orange), le système route automatiquement vers l'agrégateur actif (CamPay ou Moneroo)
2. **4 passerelles** — Chacune avec sa propre API, authentification et format de webhook
3. **Idempotence** — Verrou distribué Redis (TTL 30s) pour les webhooks concurrents
4. **Double mécanisme** — Webhooks (temps réel) + polling fallback (toutes les 15s)
5. **SSE** — Le frontend peut écouter en temps réel le statut paiement

### 3.5 Job Scheduler

| Job | Intervalle | Rôle |
|-----|:----------:|------|
| `PaymentPollingJob` | 15s | Vérifier les paiements PENDING sans webhook (backoff progressif) |
| `SessionExpiryJob` | 60s | Expirer les sessions ACTIVE arrivées à terme |
| `StaleSessionCleanupJob` | 5min | Nettoyer les sessions bloquées en PENDING_MIKROTIK > 10min |

---

## 4. Backend FastAPI

### 4.1 Stack

| Composant | Technologie |
|-----------|-------------|
| Langage | Python 3.11+ (env 3.12) |
| Framework | FastAPI 0.115.0 |
| Serveur | Uvicorn 0.30.6 |
| Validation | Pydantic 2.9.2 |
| ORM | SQLAlchemy 2.0.35 (asynchrone) |
| Driver DB | asyncpg 0.30.0 |
| Migrations | Alembic 1.13.2 (partiel — 1 seule migration) |
| Client HTTP | httpx 0.27.2 |
| Redis | redis-py 5.1.0 |
| Tests | pytest 8.3.3, pytest-asyncio |

### 4.2 Architecture (Clean Architecture)

```
app/
├── domain/models/          # 9 dataclasses pures (Hotspot, Plan, Payment, Session, Ticket, etc.)
├── domain/repositories/    # Interfaces abstraites des repositories
├── application/services/   # Cas d'usage métier
├── application/scripts/    # Scripts de connexion aux routeurs physiques
├── infrastructure/messaging/   # ActionQueue (Redis + fallback mémoire)
├── infrastructure/persistence/ # Schémas SQLAlchemy + seeders
├── infrastructure/repositories/ # Implémentations concrètes
├── presentation/api/routes/    # Endpoints FastAPI (12 routeurs)
├── presentation/api/middlewares/ # ApiKeyMiddleware
├── config/                 # Settings + Database
└── tests/                  # Tests unitaires + intégration
```

### 4.3 API Endpoints

| Groupe | Endpoints | Auth |
|--------|-----------|------|
| Health | `GET /health`, `/health/ready` | Public |
| Long Polling | `GET /router/{id}/pending-actions`, `POST /actions/{id}/done` | Router Token |
| Hotspots CRUD | 11 endpoints | API Key |
| Forfaits | 7 endpoints | API Key |
| Paiements | 5 endpoints | API Key |
| Tickets | 9 endpoints | API Key |
| Sessions | 7 endpoints | API Key |
| Dashboard | 3 endpoints | API Key |
| Routeur actions | 1 endpoint | API Key |
| Marques/Modèles | 3 endpoints | Public |
| Abonnements | 5 endpoints | API Key/public |
| Portail public | 4 endpoints | Public |
| Script download | 2 endpoints | Router Token |
| Agent | 1 endpoint | Router Token |
| **Total** | **~60 endpoints** | |

### 4.4 Modèle de données (9 entités)

| Entité | Champs clés |
|--------|-------------|
| **Hotspot** | hotspot_id, user_id, name, mikrotik_ip/port/user/password_enc, router_brand, router_token, is_online |
| **Plan** | plan_id, hotspot_id, name, duration_minutes, price (string), speeds, data_limit_mb |
| **Payment** | payment_id, reference, hotspot_id, plan_id, client_phone, operator, amount, status |
| **Session** | session_id, hotspot_id, plan_id, client_phone/mac, mikrotik_username/password, status |
| **Ticket** | ticket_id, hotspot_id, username, password, profile, time_limit, status |
| **RouterAction** | action_id, hotspot_id, type (CREATE_USER / REMOVE_USER / KICK_SESSION), status |
| **RouterBrand** | name, slug, description, logo_url |
| **RouterModel** | brand_id, name, slug, connection_type, default_port, config_schema (JSON) |
| **SubscriptionPlan** | plan_id, name, price, duration_months, advantages (dict) |

### 4.5 Communication avec les routeurs (Long Polling)

C'est l'innovation technique principale : un système de **file d'attente Redis** avec **Pub/Sub** :

```
1. Java → FastAPI : POST /tickets/activate (via API Key)
2. FastAPI : enqueue() → Redis RPUSH + SADD + PUBLISH
3. MikroTik : GET /pending-actions (Long Poll, timeout 20s)
   - Action disponible → réponse immédiate
   - Sinon → BLPOP Redis (attente bloquante)
4. MikroTik exécute l'action (création user hotspot en RAM)
5. MikroTik → FastAPI : POST /actions/{id}/done (ACK)
6. FastAPI : callback vers Java si succès (retry 3x)
```

### 4.6 Agents et scripts routeurs

| Mécanisme | Description |
|-----------|-------------|
| **Agent Python autonome** | Boucle de polling, exécute les actions directement sur les routeurs |
| **Script MikroTik natif** | Script RouterOS avec parsing JSON manuel, `/tool fetch` pour HTTPS |
| **ScriptFactory** | Pattern Factory + Singleton, 5 implémentations (MikroTik API/SSH, TP-Link HTTP, Huawei REST, Ubiquiti UniFi, Tenda HTTP) |

---

## 5. Frontend React/Vite

### 5.1 Stack

| Composant | Technologie |
|-----------|-------------|
| Framework | React 19.2.6 |
| Build | Vite 8.0.12 |
| CSS | Tailwind CSS v4 |
| Routing | React Router DOM 7.15.1 |
| State | Redux Toolkit 2.12.0 |
| HTTP | Axios 1.16.1 |
| Charts | Recharts 3.8.1 |
| Animations | Framer Motion 12.40.0 |
| Icons | Lucide React 1.16.0 |
| Notifications | Sonner 2.0.7 |
| Dates | date-fns 4.3.0 |

### 5.2 Structure des pages

| Page | Route | Description |
|------|-------|-------------|
| **Landing** | `/` | Landing page marketing (Hero, Features, Pricing, FAQ, Contact) |
| **About** | `/about` | Page À propos |
| **Login** | `/sign-in` | Connexion email + Google OAuth2 |
| **Register** | `/sign-up` | Inscription |
| **Dashboard** | `/dashboard` | KPIs, graphiques (revenus, sessions), hotspots, paiements récents |
| **Hotspots** | `/dashboard/hotspots` | Liste hotspots (tableau/grille, filtres, bulk actions) |
| **Hotspot Detail** | `/dashboard/hotspots/:slug` | Détail avec onglets (forfaits/tickets/sessions/paiements) |
| **New Hotspot** | `/dashboard/hotspots/new` | Formulaire création (3 groupes) |
| **Forfaits** | `/dashboard/forfaits` | Gestion forfaits WiFi |
| **Tickets** | `/dashboard/tickets` | Codes d'accès (import, bulk actions) |
| **Sessions** | `/dashboard/sessions` | Sessions actives/passées |
| **Paiements** | `/dashboard/payments` | Transactions, filtres, remboursements |
| **Retraits** | `/dashboard/withdrawals` | Demandes de retrait (approbation admin) |
| **Abonnements** | `/dashboard/subscriptions` | Plan actuel, upgrade, historique |
| **Profil** | `/dashboard/profile` | Informations, mot de passe, utilisation |
| **Admin Dashboard** | `/dashboard/admin` | KPIs globaux (admin) |
| **Admin Users** | `/dashboard/admin/users` | Gestion utilisateurs |
| **Admin Brands** | `/dashboard/admin/router-brands` | Marques/modèles routeurs |
| **Admin Settings** | `/dashboard/admin/settings` | Paramètres système (8 sections) |
| **Onboarding** | `/onboarding` | Assistant 5 étapes pour nouveau hotspot |
| **Portail captif** | `/portal/:hotspotId` | Page publique : choisir forfait → payer Mobile Money → accès WiFi |

### 5.3 Gestion d'état Redux

```
Store
├── authSlice
│   ├── user, userId, role, planType
│   ├── accessToken, refreshToken (dans localStorage)
│   ├── isAuthenticated, isNewUser
│   ├── loading, error, fieldErrors
│   └── Thunks: loginUser, registerUser, fetchMe, logoutUser, googleLogin
│
└── uiSlice
    ├── sidebarOpen (true/false)
    ├── theme ('dark' | 'light', localStorage)
    ├── locale ('fr' | 'en', localStorage)
    └── searchQuery (recherche globale)
```

### 5.4 Feature gating par plan

Le hook `usePlan()` centralise les limites par abonnement :

| Fonctionnalité | STANDARD | PRO | PREMIUM |
|----------------|:--------:|:---:|:-------:|
| Graphiques TicketDonut | ✗ | ✓ | ✓ |
| Top Hotspots | ✗ | ✓ | ✓ |
| KPI Plans | ✗ | ✓ | ✓ |
| Période max | 7j | 90j | Custom |
| Export CSV | ✗ | ✓ | ✓ |
| Filtres paiement par opérateur | ✗ | ✓ | ✓ |
| Filtres paiement par montant | ✗ | ✗ | ✓ |
| Remboursement | ✗ | ✗ | ✓ (admin) |
| Audit timeline | ✗ | ✗ | ✓ |
| Graphiques activité | ✗ | ✓ | ✓ |
| Marques routeurs autorisées | MikroTik | Toutes | Toutes |

### 5.5 Intercepteur Axios (refresh token)

Le système de refresh token est implémenté avec :
- **File d'attente** des requêtes en échec (401 simultanés)
- **Instance axios dédiée** pour le refresh (évite les boucles infinies)
- **Rotation** des refresh tokens
- **Redirection** vers `/sign-in` si le refresh échoue

---

## 6. Flux métier détaillés

### 6.1 Paiement Mobile Money → Accès WiFi (flux complet)

```
1. CLIENT
   Le client se connecte au WiFi → redirigé vers le portail captif
   GET /portal/{hotspotId}?mac=AA:BB:CC:DD:EE:FF
   
2. SPRING BOOT
   Charge les infos hotspot + forfaits actifs (via FastAPI)
   Affiche la page portail avec les forfaits disponibles
   
3. CLIENT
   Choisit un forfait (ex: "2 Heures - 500 XAF")
   -> MTN Mobile Money
   POST /portal/pay { hotspotId, planId, phone: "671234567", operator: "MTN_MOMO" }
   
4. SPRING BOOT
   - Valide hotspot + plan (via FastAPI)
   - Résout la passerelle : Campay (prioritaire Cameroun)
   - Initie le paiement : campay.requestToPay(phone, amount)
   - Crée Payment (statut PENDING)
   - Retourne { reference: "PAY-abc123" }
   
5. CLIENT
   Reçoit une demande de paiement sur son téléphone (USSD MTN MoMo)
   Confirme le paiement sur son téléphone
   
6. SPRING BOOT (webhook)
   Campay appelle POST /payments/campay/webhook
   - Vérifie IP whitelist
   - Verrou Redis (idempotence)
   - Forward vers FastAPI
   - Statut → PAID
   
   ou (fallback) PaymentPollingJob toutes les 15s
   
7. SPRING BOOT
   - Cherche un ticket disponible (ou génère des credentials)
   - Crée Session (PENDING_MIKROTIK)
   - POST /api/v1/tickets/activate-direct vers FastAPI
   
8. FASTAPI
   - Crée RouterAction (type: CREATE_USER)
   - Enqueue dans Redis
   - Pub/Sub notifie le routeur
   
9. ROUTEUR MIKROTIK (Long Polling)
   GET /router/{id}/pending-actions?token=xxx
   - Récupère l'action CREATE_USER
   - Exécute : /ip hotspot user add name=TICKET123 password=abc profile=default
   - ACK : POST /actions/{id}/done?token=xxx
   
10. FASTAPI
    - Marque l'action ACK_SUCCESS
    - Callback vers Java : POST /internal/router-callback/session-activated
    
11. SPRING BOOT
    - Session → ACTIVE
    - Client peut naviguer !
```

### 6.2 Import de tickets depuis MikroTik

```
1. Java : POST /hotspots/{id}/tickets/import { tickets: [...] }
   → FastAPI : POST /api/v1/tickets/import
   → Déduplication par (username + hotspot_id)
   → Retourne résultat (success/duplicates/errors)

2. Activation d'un ticket (connexion client) :
   Portail : POST /portal/{hotspotId}/tickets/connect { username, password }
   → Vérifie disponibilité
   → Active → crée action CREATE_USER
```

### 6.3 Abonnement SaaS

```
1. Utilisateur STANDARD veut passer à PRO
   POST /subscriptions { planName: "PRO", durationMonths: 1 }
   
2. Paiement via Mobile Money (même flux que 6.1)
   
3. Plan mis à jour → nouvelles limites disponibles
   
4. Tâche de fond vérifie l'expiration des abonnements
```

---

## 7. Relations entre projets

### 7.1 Backend Java ↔ Backend FastAPI

Spring Boot agit comme **proxy** et **orchestrateur** :

| Ce que Spring Boot délègue à FastAPI | Ce que Spring Boot gère en direct |
|--------------------------------------|-----------------------------------|
| CRUD hotspots | Authentification JWT |
| CRUD forfaits WiFi | Paiements Mobile Money |
| Gestion des tickets | Portail captif |
| Sessions WiFi | Notifications (email/SMS) |
| Statistiques dashboard | Parameters système |
| Actions routeurs | Abonnements SaaS |
| Marques/modèles routeurs | Retraits |
| Script download | Audit logging |

### 7.2 Backend Java ↔ Frontend

- Communication via API REST (`http://localhost:8080/api/V1`)
- Authentification JWT (Bearer token)
- Refresh token avec file d'attente côté frontend

### 7.3 Backend FastAPI ↔ Routeurs

- Long Polling HTTPS (GET puis ACK POST)
- Routeur s'authentifie via `X-Router-Token` (query parameter)
- Script MikroTik natif embarque le polling directement dans RouterOS

### 7.4 Backend FastAPI ↔ Frontend (portail captif)

- Appels directs sans JWT (API publique)
- Instance axios dédiée (`publicAxios.js`)

---

## 8. Sécurité

### 8.1 Mesures en place

| Mesure | Implémentation |
|--------|---------------|
| JWT HMAC-SHA256 | Access token 24h, Refresh token 7j (Redis) |
| Google OAuth2 | Connexion via ID token Google |
| API Key inter-service | Header `X-API-Key` entre Java et FastAPI |
| IP whitelist | Webhooks opérateurs |
| Rate limiting | 100 req/min (portail, auth, webhooks) |
| Chiffrement Jasypt | Mots de passe MikroTik chiffrés |
| CORS | Configurable (wildcard en dev) |
| Sessions stateless | Spring Security STATELESS |
| Refresh rotation | Chaque refresh invalide l'ancien token |

### 8.2 Problèmes de sécurité critiques

> ⚠️ **Ces problèmes doivent être corrigés avant déploiement en production**

1. **JWT secret en clair** dans `application.properties` (base64, 64 chars)
2. **Mot de passe PostgreSQL** en clair : `Teda@2003`
3. **Google OAuth2 credentials** exposés (client-id + client-secret)
4. **Mot de passe admin** en dur dans `DataInitializer.java` : `Made@2006`
5. **CORS `*` en dev** → acceptable uniquement en développement
6. **Signature HMAC absente** pour les webhooks Moneroo

---

## 9. Problèmes identifiés

### 9.1 Problèmes d'architecture

| ID | Problème | Impact | Sévérité |
|:--:|----------|--------|:--------:|
| A1 | **Dualité Spring Boot / FastAPI** : logique hotspot split sur 2 services | Complexité opérationnelle, 2 pipelines de déploiement | ⚠️ |
| A2 | **Pas de FK SQL** dans FastAPI : toutes les relations sont logiques | Incohérence potentielle des données | ⚠️ |
| A3 | **Types String pour les enums** dans FastAPI (VARCHAR au lieu de ENUM) | Pas de validation DB | ⚠️ |
| A4 | **Alembic partiel** : seule la table `subscription_plans` est versionnée | Migration non traçable pour la majorité des tables | ⚠️ |
| A5 | **Noms de DB incohérents** : `hotspotPay_V2` (Java) vs `hotspot_pay` (Docker) | Confusion, erreur potentielle | ⚠️ |
| A6 | **Refresh tokens Redis** : pas de fallback si Redis est down en prod | Impossible de se reconnecter | ⚠️ |

### 9.2 Problèmes de sécurité

| ID | Problème | Sévérité |
|:--:|----------|:--------:|
| S1 | Secrets en clair dans les fichiers de propriétés | 🔴 Critique |
| S2 | Google OAuth credentials exposés | 🔴 Critique |
| S3 | Mot de passe admin en dur dans le code | 🔴 Critique |
| S4 | Pas de validation HMAC Moneroo | 🟡 Élevé |
| S5 | CORS wildcard (`*`) en production probable | 🟡 Élevé |
| S6 | IP whitelist pour webhooks = `*` par défaut | 🟡 Élevé |

### 9.3 Problèmes de code

| ID | Problème | Sévérité |
|:--:|----------|:--------:|
| C1 | **MapStruct installé mais inutilisé** : 160 fichiers, pas de mapper en production | 🟡 Nettoyage |
| C2 | **ID hotspot exposée** en query paramètre `user_id` dans les URLs | 🟡 Information leak |
| C3 | **Aucun test Spring Boot** (Testcontainers présent mais tests vides) | 🟡 Risque |
| C4 | **README frontend** = template Vite par défaut, non personnalisé | 🟢 Documentation |
| C5 | **Snake_case ↔ camelCase** : conversion manuelle dans plusieurs pages frontend | 🟢 Redondance |

### 9.4 Problèmes de déploiement

| ID | Problème | Sévérité |
|:--:|----------|:--------:|
| D1 | **Ngrok config** dans le code (dev uniquement) | 🟢 RAS en prod |
| D2 | **2 Dockerfiles** séparés (Java + FastAPI) mais pas de docker-compose global | 🟡 Complexité |
| D3 | **Script `start-dev.ps1`** pointe vers `F:` (autre disque) | 🟢 Config locale |

---

## 10. Recommandations

### 10.1 Priorité haute (faire maintenant)

1. **🔴 Externaliser tous les secrets** dans des variables d'environnement ou vault
   - JWT secret, passwords DB, OAuth credentials, admin password
   - Utiliser un `.env` par environnement (existe déjà pour FastAPI)

2. **🔴 Restreindre CORS** aux origines réelles en production
   - `cors.allowed-origins` doit être une liste explicite

3. **🟡 Restreindre IP whitelist** pour webhooks
   - Remplacer `webhook.allowed-ips=*` par les IPs réelles des opérateurs

### 10.2 Priorité moyenne (sprint en cours)

4. **🟡 Ajouter validation HMAC** pour les webhooks Moneroo
5. **🟡 Unifier les noms de bases de données** (Docker compose vs properties)
6. **🟡 Rendre les refresh tokens Redis résilients** (fallback mémoire ou DB)
7. **🟡 Nettoyer MapStruct** si pas utilisé (ou l'utiliser pour le mapping DTO)
8. **🟡 Ajouter des tests Spring Boot** (au minimum pour les flux paiement)

### 10.3 Priorité basse (améliorations)

9. **🟢 Ajouter FK contraintes** dans les schémas FastAPI
10. **🟢 Migrer les VARCHAR enums vers des ENUM PostgreSQL**
11. **🟢 Versionner toutes les tables avec Alembic** (pas seulement subscription_plans)
12. **🟢 Personnaliser le README du frontend**
13. **🟢 Centraliser la conversion snake_case/camelCase** côté FastAPI (pydantic alias generator déjà présent)

### 10.4 Architecture (vision long terme)

14. **🤔 Fusionner ou clarifier la séparation Spring Boot / FastAPI**
    - Option A : Tout dans Spring Boot (migrer FastAPI dedans)
    - Option B : Faire de Spring Boot un vrai BFF dédié auth+paiement
    - Option C : Tout dans FastAPI (mais perte de l'écosystème Java/Spring)

15. **🤔 Standardiser le format de réponse API**
    - `ApiResponse<T>` dans Spring Boot avec `{ success, data, error }`
    - Vérifier la cohérence avec FastAPI

16. **🤔 Docker Compose unique** pour les 3 services (+ DB + Redis)

---

## Annexe A : Configuration des projets

### Backend Java
- **Path :** `C:\Projet Patrick\Backend\Java\hotspot_pay\`
- **Port :** 8080
- **Base path :** `/api/V1`
- **Profiles :** dev, prod (refresh tokens Redis vs mémoire)
- **Migrations :** Flyway, 26 migrations dans `src/main/resources/db/migration/`

### Backend FastAPI
- **Path :** `C:\Projet Patrick\Backend\Fastapi\hotspot_pay\`
- **Port :** 8444
- **Base path :** `/api/v1` (note : minuscule)

### Frontend
- **Path :** `C:\Projet Patrick\Frontend\hotspot_pay\`
- **Port dev :** 5173
- **API base :** `http://localhost:8080/api/V1`

## Annexe B : Estimation de l'effort de développement

| Module | Estimation |
|--------|:----------:|
| Backend Java | ~15 000 lignes, 4-6 mois personne |
| Backend FastAPI | ~8 000 lignes, 2-3 mois personne |
| Frontend | ~12 000 lignes, 3-4 mois personne |
| **Total** | **~35 000 lignes** | 

---

*Analyse générée le 21 juin 2026 par Claude Code (Opus 4.8)*
