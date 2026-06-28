# HotspotPay — Architecture du Backend Java (Spring Boot)

> **Projet** : `mvp-final-v2` · **Port** : `8080` · **Java 21** · **Spring Boot 3.3.0**

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Structure du projet](#3-structure-du-projet)
4. [Sécurité](#4-sécurité)
5. [Flux de paiement complet](#5-flux-de-paiement-complet)
6. [Intégration FastAPI](#6-intégration-fastapi)
7. [Base de données](#7-base-de-données)
8. [API REST](#8-api-rest)
9. [Tâches planifiées](#9-tâches-planifiées)
10. [Temps réel (SSE)](#10-temps-réel-sse)
11. [Configuration](#11-configuration)

---

## 1. Vue d'ensemble

HotspotPay est une **plateforme SaaS de portail captif** qui permet aux opérateurs de hotspots WiFi de :

- Gérer leurs hotspots (routeurs MikroTik, TP-Link, etc.)
- Vendre des forfaits internet via Mobile Money (MTN, Orange, CamPay, Moneroo)
- Activer automatiquement les connexions après paiement
- Suivre les revenus et les sessions en temps réel

### Architecture globale

```
Browser (React) ──JWT──▶ Java Spring Boot (:8080) ──X-API-Key──▶ FastAPI Python (:8444)
                                 │                                              │
                                 ▼                                              ▼
                           PostgreSQL (hotspotPay_V2)                  PostgreSQL (hotspot_fastapi)
                                 │                                              │
                                 ▼                                              ▼
                            Redis cache                                  Redis queue (actions)
                                 │                                              │
                                 ▼                                              ▼
                           MikroTik Router ◀─────── Long Polling ───────────────┘
```

### Principe de fonctionnement

1. L'utilisateur choisit un forfait sur le portail captif
2. Java initie le paiement via Mobile Money (Moneroo, CamPay, MTN, Orange)
3. Le fournisseur de paiement envoie un webhook à Java
4. Java confirme le paiement et appelle FastAPI pour créer une action routeur
5. FastAPI met l'action en file d'attente Redis
6. Le routeur MikroTik (en long polling) récupère l'action et crée l'utilisateur
7. Le routeur confirme l'exécution à FastAPI
8. FastAPI notifie Java via callback
9. Java active la session et notifie le frontend via SSE

---

## 2. Stack technique

| Composant | Technologie |
|-----------|------------|
| **Framework** | Spring Boot 3.3.0 |
| **Langage** | Java 21 |
| **Base de données** | PostgreSQL 16 (via Flyway migrations) |
| **Cache** | Redis 3.0 |
| **Auth** | JWT (jjwt) + OAuth2 Google |
| **Paiements** | Moneroo, CamPay, MTN MoMo, Orange Money |
| **Scheduling** | Quartz Scheduler |
| **Docs API** | SpringDoc OpenAPI / Swagger |
| **Mapping** | MapStruct |
| **Templates** | Thymeleaf (emails) |
| **Build** | Maven (wrapper mvnw) |

---

## 3. Structure du projet

```
src/main/java/com/hotspotpay/
├── auth/                  # Authentification (JWT, OAuth2, Google)
│   ├── controller/        # AuthController, GoogleAuthController
│   ├── service/           # AuthServiceImpl, RefreshTokenService
│   ├── model/             # User principal, RefreshToken
│   ├── dto/               # LoginRequest, RegisterRequest, etc.
│   ├── config/            # SecurityConfig, JwtConfig
│   └── filter/            # JwtAuthFilter, RateLimitFilter
│
├── users/                 # Gestion des utilisateurs
│   ├── controller/        # UserController, AdminUserController
│   ├── service/           # UserService, UserPlanService
│   └── model/             # User entity
│
├── hotspot/               # Gestion des hotspots
│   ├── controller/        # HotspotController
│   ├── service/           # HotspotService
│   ├── model/             # Hotspot entity
│   └── dto/               # CreateHotspotRequest, UpdateHotspotRequest
│
├── plan/                  # Gestion des forfaits
│   ├── controller/        # PlanController
│   ├── service/           # PlanService
│   ├── model/             # Plan entity
│   └── dto/               # PlanRequest, PlanResponse
│
├── payment/               # Paiements
│   ├── controller/        # PaymentController
│   ├── service/           # PaymentServiceImpl
│   ├── gateway/           # MonerooGateway, CampayGateway, MtnMoMoGateway, OrangeMoneyGateway
│   ├── model/             # Payment entity
│   └── dto/               # PaymentRequest, PaymentResponse
│
├── session/               # Sessions WiFi
│   ├── controller/        # SessionController
│   ├── service/           # SessionServiceImpl
│   ├── model/             # Session entity
│   └── job/               # SessionExpiryJob
│
├── portal/                # Portail captif (public)
│   ├── controller/        # PortalController
│   └── service/           # PortalService
│
├── router/                # Communication avec FastAPI
│   ├── service/           # FastApiClient, FastApiRetryHelper
│   │                      # FastApiPaymentClient, FastApiSessionClient
│   │                      # FastApiPlanClient, FastApiTicketClient
│   │                      # FastApiTicketCrudClient, FastApiDashboardClient
│   │                      # FastApiSubscriptionClient, FastApiRouterActionClient
│   │                      # FastApiMonitoringClient
│   ├── controller/        # RouterCallbackController
│   └── dto/               # RouterTokenResponse, RouterActionResponse
│
├── integration/           # Intégrations externes
│   └── moneroo/           # MonerooProperties, MonerooConfig
│
├── ticket/                # Tickets prépayés
│   ├── controller/        # TicketController
│   └── service/           # TicketService
│
├── withdrawal/            # Retraits opérateurs
│   ├── controller/        # WithdrawalController
│   ├── service/           # WithdrawalService
│   └── model/             # Withdrawal entity
│
├── subscription/          # Abonnements
│   ├── model/             # Subscription, SubscriptionPlan
│   └── service/           # SubscriptionService
│
├── support/               # Support / Contact
│   ├── controller/        # SupportController
│   └── model/             # ContactMessage, Faq
│
├── systemsettings/        # Paramètres système (admin)
│   ├── controller/        # AdminSettingsController
│   ├── service/           # AdminSettingsService
│   └── model/             # SystemSetting entity
│
├── monitoring/            # Monitoring
│   ├── controller/        # HealthController, AdminMonitoringController
│   └── service/           # FastApiMonitoringClient
│
├── scheduler/             # Tâches planifiées
│   └── jobs/              # PaymentPollingJob, StaleSessionCleanupJob
│
├── sse/                   # Server-Sent Events
│   ├── controller/        # SseController, SystemSseController
│   └── service/           # SseService, SystemSseService
│
├── upload/                # Upload de fichiers
│   └── service/           # FileStorageService
│
├── audit/                 # Audit logging
│   ├── service/           # AuditService
│   └── model/             # AuditLog entity
│
├── common/                # Classes partagées
│   ├── exception/         # GlobalExceptionHandler, exceptions métier
│   ├── dto/               # ApiResponse<T>, PageResponse<T>
│   └── util/              # Utilities
│
└── router/ → brands/      # Marques de routeurs
    ├── controller/        # RouterBrandController, RouterModelController
    ├── service/           # RouterBrandService, RouterModelService
    └── model/             # RouterBrand, RouterModel entities
```

---

## 4. Sécurité

### Authentication

| Méthode | Détails |
|---------|---------|
| **JWT Access Token** | 24h expiration, signé HMAC-SHA384 |
| **JWT Refresh Token** | 7j expiration avec rotation |
| **Google OAuth2** | OpenID Connect, création auto de compte |
| **TOTP (2FA)** | Support optionnel |

### Configuration CORS

```yaml
# Développement
allowed-origins: *
# Production (dans application-prod.properties)
allowed-origins: https://mon-domaine.com
```

### Rate Limiting

| Endpoint | Limite |
|----------|--------|
| Portail captif | 100 req/min |
| Authentification | 100 req/min |
| Webhooks | 100 req/min |

### IP Whitelisting

- **Webhooks paiement** : IPs des fournisseurs
- **Callbacks routeur** : IPs des routeurs MikroTik
- **Admin** : IPs autorisées (optionnel)

---

## 5. Flux de paiement complet

```
1. UTILISATEUR
   │
   ▼
2. PortalController.initiatePayment()
   │
   ▼
3. PaymentServiceImpl.initiatePayment()
   │
   ├──► Validation hotspot + plan via FastAPI
   │
   ▼
4. MonerooGateway.initiatePayment()
   │
   ├──► POST https://api.moneroo.io/v1/payments/initialize
   │     Authorization: Bearer <api_key>
   │     { amount, currency, returnUrl, notifyUrl }
   │
   ▼
5. Response: { checkoutUrl, reference }
   │
   ▼
6. Redirection utilisateur → checkoutUrl
   │
   ▼
7. Moneroo envoie WEBHOOK → PaymentController.webhookMoneroo()
   │     Vérification signature X-Moneroo-Signature
   │
   ▼
8. PaymentServiceImpl.confirmPayment()
   │
   ├──► Update Payment → PAID
   │
   ▼
9. FastApiPaymentClient.createRouterAction()
   │     POST /api/v1/actions/create
   │
   ▼
10. FastAPI enqueue l'action CREATE_USER
    │
    ▼
11. MikroTik routeur long-poll → récupère l'action
    │
    ▼
12. Routeur exécute l'action (création user DHCP)
    │
    ▼
13. MikroTik POST /api/v1/router/{id}/actions/{id}/done
    │
    ▼
14. FastAPI → Java Callback (X-Callback-Secret)
    │
    ▼
15. Java → Session activée (ACTIVE)
    │
    ▼
16. SSE → Frontend notifié en temps réel
```

### Circuit breaker & Retry

Tous les appels vers FastAPI utilisent `FastApiRetryHelper` :
- **3 tentatives** avec backoff exponentiel (1s, 2s)
- **Timeout connexion** : 5s
- **Timeout lecture** : 10-15s
- Log warning sur chaque échec partiel
- Log error après 3 échecs → retour `null`

---

## 6. Intégration FastAPI

### Clients HTTP (10 classes)

| Client | Endpoints | Usage |
|--------|-----------|-------|
| `FastApiClient` | Hotspots CRUD + test + token | Gestion hotspots |
| `FastApiPaymentClient` | Paiements, webhooks, refunds | Flux paiement |
| `FastApiSessionClient` | Sessions CRUD, revoke | Sessions WiFi |
| `FastApiPlanClient` | Plans CRUD, toggle | Forfaits |
| `FastApiTicketCrudClient` | Tickets CRUD, import, purge | Tickets prépayés |
| `FastApiTicketClient` | Activate ticket | Activation ticket |
| `FastApiDashboardClient` | Overview, stats | Dashboard |
| `FastApiSubscriptionClient` | Subscriptions | Abonnements |
| `FastApiRouterActionClient` | Create action | Actions routeur |
| `FastApiMonitoringClient` | Monitoring | Admin monitoring |

### Communication

```
Java ──► FastAPI : X-API-Key (header)
FastAPI ──► Java : X-Callback-Secret (header, callback uniquement)

Format : JSON
Timeouts :
  - Connexion : 5s
  - Lecture    : 10s (standard) / 15s (monitoring)
```

---

## 7. Base de données

### PostgreSQL — `hotspotPay_V2`

**Migrations Flyway** (V1 → V39+)

| Migration | Contenu |
|-----------|---------|
| V1-V9 | Core : users, hotspots, plans, payments, sessions |
| V10-V19 | Withdrawals, webhook_events, tickets, router_tokens |
| V20-V29 | Router brands, router models, system_settings |
| V30-V39 | FAQs, contact_messages, 2FA, password_reset, webhook settings |

### Tables principales

| Table | Description |
|-------|-------------|
| `users` | Opérateurs, admins, TOTP 2FA |
| `hotspots` | Points d'accès WiFi, credentials routeur encryptés |
| `plans` | Forfaits (durée, débit, quota) |
| `payments` | Transactions Mobile Money |
| `sessions` | Sessions WiFi actives/expirées |
| `tickets` | Codes prépayés |
| `router_actions` | File d'actions routeur (cache local) |
| `system_settings` | Paramètres configurables via admin |
| `audit_logs` | Traçabilité des actions admin |

---

## 8. API REST

### Authentification

```
POST /api/V1/auth/register       — Inscription
POST /api/V1/auth/login          — Connexion (return JWT)
POST /api/V1/auth/refresh        — Rafraîchir token
POST /api/V1/auth/google         — Google OAuth
POST /api/V1/auth/forgot-password
POST /api/V1/auth/reset-password
```

### Hotspots

```
GET    /api/V1/hotspots                    — Liste (scope: self/global)
POST   /api/V1/hotspots                    — Créer
GET    /api/V1/hotspots/{id}               — Détail
PUT    /api/V1/hotspots/{id}               — Modifier
DELETE /api/V1/hotspots/{id}               — Supprimer
POST   /api/V1/hotspots/{id}/test         — Tester connexion
POST   /api/V1/hotspots/{id}/generate-token — Générer token routeur
DELETE /api/V1/hotspots/{id}/router-token  — Révoquer token
```

### Paiements

```
POST   /api/V1/payments/initiate           — Initier paiement
GET    /api/V1/payments/status/{ref}       — Statut paiement
POST   /api/V1/payments/*/webhook          — Webhook fournisseur
```

### Portail Captif

```
GET    /api/V1/portal/{hotspotId}          — Page portail
POST   /api/V1/portal/pay                  — Payer
GET    /api/V1/portal/payment/{ref}/status — Polling statut
```

### Admin

```
GET    /api/V1/admin/health                — Santé système
GET    /api/V1/admin/monitoring/*          — Monitoring
GET    /api/V1/admin/settings              — Paramètres système
PUT    /api/V1/admin/settings              — Modifier paramètres
```

---

## 9. Tâches planifiées

| Job | Intervalle | Description |
|-----|-----------|-------------|
| `PaymentPollingJob` | 15s | Re-vérifie les paiements PENDING non confirmés par webhook |
| `SessionExpiryJob` | 60s | Expire les sessions ayant atteint leur limite |
| `StaleSessionCleanupJob` | 24h | Nettoie les sessions plus vieilles que la rétention |

Tous les jobs utilisent Redis pour le **distributed locking** (évite les doubles traitement en multi-instance).

---

## 10. Temps réel (SSE)

### Endpoints SSE

```
GET /api/V1/sse/subscribe/{userId}     — Événements utilisateur
GET /api/V1/sse/admin/subscribe        — Événements admin
GET /api/V1/sse/system/events          — Événements système
```

### Événements broadcastés

- `payment.status` — Changement de statut paiement
- `session.activated` — Session activée
- `session.expired` — Session expirée
- `router.status` — Routeur online/offline
- `system.notification` — Notifications système

---

## 11. Configuration

### Variables d'environnement (.env)

| Variable | Rôle |
|----------|------|
| `BASE_URL` | URL publique pour webhooks |
| `DB_HOST/PORT/NAME/USER/PASSWORD` | PostgreSQL |
| `REDIS_HOST/PORT/PASSWORD` | Redis |
| `JWT_SECRET` | Clé de signature JWT (64 chars base64) |
| `JASYPT_KEY` | Clé de déchiffrement des mots de passe routeur |
| `FASTAPI_BASE_URL` | URL du microservice FastAPI |
| `FASTAPI_API_KEY` | Clé API pour appels FastAPI |
| `FASTAPI_CALLBACK_SECRET` | Secret pour callbacks FastAPI→Java |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth2 Google |
| `MONEROO_API_KEY` | Clé API Moneroo |
| `CAMPAY_USERNAME/PASSWORD` | Credentials Campay |
| `MTN_MOMO_*` | Credentials MTN Mobile Money |
| `ORANGE_MONEY_KEY` | Clé Orange Money |
| `MAIL_HOST/USERNAME/PASSWORD` | SMTP (Gmail, Hostinger) |
| `CORS_ALLOWED_ORIGINS` | Origines CORS autorisées |

### Profils Spring

| Profil | Usage |
|--------|-------|
| `default` | Prod-like (lit .env) |
| `dev` | Développement local (valeurs de fallback hardcodées) |
| `prod` | Production (lecture stricte depuis .env) |

---

## 12. Monitoring & Observabilité

- **Actuator** : `/actuator/health`, `/actuator/metrics`, `/actuator/prometheus`
- **Swagger** : `/swagger-ui/index.html`
- **Admin health** : Vue détaillée (DB, Redis, FastAPI, Disk)
- **Logging** : SLF4J + Logback, niveaux configurables

---

> **Documentation générée le 25 juin 2026** — Projet HotspotPay, version MVP-final-v2
