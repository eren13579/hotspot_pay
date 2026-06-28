# HotspotPay — Architecture du Microservice FastAPI

> **Projet** : `HOSPOT-FASTAPI-SERVICE` · **Port** : `8444` · **Python 3.12** · **FastAPI 0.111+**

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Structure du projet](#3-structure-du-projet)
4. [Le pattern Long Polling](#4-le-pattern-long-polling)
5. [File d'attente d'actions (Redis)](#5-file-dattente-dactions-redis)
6. [Communication FastAPI ⇄ Java](#6-communication-fastapi--java)
7. [Système de tokens routeur](#7-système-de-tokens-routeur)
8. [API REST complète](#8-api-rest-complète)
9. [Base de données](#9-base-de-données)
10. [Agent routeur universel](#10-agent-routeur-universel)
11. [Scripts MikroTik](#11-scripts-mikrotik)
12. [Configuration](#12-configuration)
13. [Sécurité](#13-sécurité)

---

## 1. Vue d'ensemble

Le microservice FastAPI est le **cerveau de l'orchestration MikroTik**. Il fait le pont entre :

- **Java** (le backend Spring Boot qui reçoit les requêtes frontend)
- **Les routeurs MikroTik** (et autres marques) qui exécutent les actions

Son rôle principal : **recevoir des actions à exécuter sur les routeurs, les mettre en file d'attente, et les livrer aux routeurs via un mécanisme de Long Polling**.

### Pourquoi un microservice dédié ?

Historiquement, la logique MikroTik était dans le backend Java. Elle en a été extraite pour :

1. **Isolation des pannes** : un crash du service MikroTik n'affecte pas les paiements
2. **Temps réel** : le Long Polling nécessite des connexions longues (indésirables dans un serveur web classique)
3. **Indépendance technologique** : la bibliothèque `routeros_api` est Python-native
4. **Scalabilité** : le service peut être dimensionné indépendamment

---

## 2. Stack technique

| Composant | Technologie |
|-----------|------------|
| **Framework** | FastAPI 0.111+ |
| **Runtime** | Python 3.12+ via Uvicorn |
| **Base de données** | PostgreSQL 16 (async via SQLAlchemy 2.0 + asyncpg) |
| **Cache / Queue** | Redis 3.0 (aioredis) |
| **Migrations** | Alembic |
| **Validation** | Pydantic v2 |
| **Routeurs** | routeros_api 0.21.0 (MikroTik API) |

---

## 3. Structure du projet

```
HOSPOT-FASTAPI-SERVICE/
├── app/
│   ├── main.py                          # Entry point FastAPI + middlewares
│   │
│   ├── config/
│   │   ├── settings.py                  # Pydantic Settings (toute la config)
│   │   └── database.py                  # AsyncSession SQLAlchemy + engine
│   │
│   ├── domain/
│   │   ├── models/                      # Modèles SQLAlchemy
│   │   │   ├── hotspot.py               #   Hotspot (routeur)
│   │   │   ├── router_action.py         #   Action à exécuter
│   │   │   ├── session.py               #   Session WiFi
│   │   │   ├── payment.py               #   Paiement
│   │   │   ├── plan.py                  #   Forfait
│   │   │   ├── ticket.py                #   Ticket prépayé
│   │   │   └── subscription.py          #   Abonnement
│   │   └── repositories/                # Interfaces de repositories
│   │
│   ├── application/
│   │   ├── services/                    # Services métier
│   │   │   ├── hotspot_service.py       #   Gestion hotspots
│   │   │   ├── router_action_service.py #   File d'actions routeur ★
│   │   │   ├── session_service.py       #   Sessions WiFi
│   │   │   ├── payment_service.py       #   Paiements
│   │   │   ├── plan_service.py          #   Forfaits
│   │   │   ├── ticket_service.py        #   Tickets
│   │   │   ├── script_generator_service.py  # Génération scripts routeur
│   │   │   └── callback_service.py      # Callbacks vers Java
│   │   └── scripts/
│   │       ├── mikrotik.py              #   Connexion API MikroTik
│   │       ├── tplink.py                #   Connexion TP-Link
│   │       └── base_router.py           #   Interface routeur abstraite
│   │
│   ├── infrastructure/
│   │   ├── messaging/
│   │   │   └── action_queue.py          # File Redis + fallback mémoire ★
│   │   ├── persistence/
│   │   │   └── schemas/                 # Schémas DB (vides, gérés par Alembic)
│   │   └── repositories/                # Implémentations SQLAlchemy
│   │       ├── hotspot_repository.py
│   │       ├── router_action_repository.py
│   │       ├── session_repository.py
│   │       └── ...
│   │
│   ├── presentation/
│   │   └── api/
│   │       ├── routes/                  # Endpoints REST
│   │       │   ├── router.py            #   Long Polling MikroTik ★
│   │       │   ├── hotspots.py          #   CRUD hotspots
│   │       │   ├── sessions.py          #   Sessions
│   │       │   ├── payments.py          #   Paiements
│   │       │   ├── plans.py             #   Forfaits
│   │       │   ├── tickets.py           #   Tickets
│   │       │   ├── admin.py             #   Monitoring admin
│   │       │   └── subscriptions.py     #   Abonnements
│   │       ├── schemas/                 # Schémas Pydantic (Request/Response)
│   │       └── middlewares/             # Middleware API Key
│   │
│   └── common/
│       └── exceptions.py                # Exceptions métier
│
├── alembic/                             # Migrations DB
│   ├── versions/                        # Fichiers de migration
│   └── env.py
│
├── agent/                               # Scripts agents routeur
│   └── hotspotpay_agent.py              #   Agent Python universel
│
├── scripts/                             # Utilitaires
│   ├── generate_prod_env.sh
│   └── seed_router_data.py
│
├── redis/                               # Serveur Redis Windows portable
├── redis.zip                            # Distribution Redis
├── requirements.txt
├── pyproject.toml
├── Dockerfile
└── docker-compose.yml
```

---

## 4. Le pattern Long Polling

C'est le **cœur du système**. Contrairement aux WebSockets ou SSE, le Long Polling permet aux routeurs MikroTik (qui ne supportent que des scripts shell basiques) de recevoir des actions en temps réel.

### Fonctionnement

```
Routeur MikroTik                    FastAPI
      │                                │
      │  1. GET /pending-actions       │
      │     Header: X-Router-Token     │
      │───────────────────────────────▶│
      │                                │
      │   2. Vérification du token     │
      │   3. Check file Redis queue    │
      │                                │
      ├── Si action disponible ────────┤
      │   ← 200 { actions: [...] }     │
      │                                │
      ├── Si pas d'action ─────────────┤
      │   ← Attente jusqu'à 10s        │
      │   ← 200 { actions: [] }        │
      │   (le routeur rappelle)        │
      │                                │
      │  4. POST /actions/{id}/done    │
      │     { status: "success" }      │
      │───────────────────────────────▶│
      │                                │
      │   5. ACK → retire de la queue  │
      │   6. Callback → Java           │
```

### Pourquoi Long Polling ?

| Critère | WebSocket | SSE | Long Polling |
|---------|-----------|-----|-------------|
| Compatible MikroTik Script | ❌ | ❌ | ✅ |
| Temps réel | ✅ | ✅ | ≈ 5s |
| Simple à déployer | ❌ | ✅ | ✅ |
| Connexions simultanées | Élevé | Élevé | Limité |

### Configuration

```python
LONG_POLL_TIMEOUT = 10  # secondes d'attente max
# Le routeur rappelle toutes les ~5 secondes
```

---

## 5. File d'attente d'actions (Redis)

### Architecture

```
Java ──POST /actions/create──▶ FastAPI ──enqueue──▶ Redis List (hotspot:{id}:actions)
                                                        │
Routeur ◀──long poll───  FastAPI ◀──dequeue─────────────┘
```

### Implémentation : `action_queue.py`

Deux backends, avec fallback automatique :

```python
class ActionQueue:
    """Hybrid queue: Redis primary, asyncio.Queue fallback"""

    def __init__(self, redis_url: str | None):
        if redis_url:
            self.redis = await redis.from_url(redis_url)   # Redis
            self.fallback = None
        else:
            self.redis = None
            self.fallback = asyncio.Queue()                 # Fallback mémoire
```

### Opérations

| Méthode | Description |
|---------|-------------|
| `enqueue(hotspot_id, action)` | Ajoute une action dans la file du hotspot |
| `wait_for_actions(hotspot_id, timeout)` | Attend une action (avec timeout) |
| `mark_delivered(hotspot_id, action_id)` | Marque comme délivrée |
| `get_pending_actions(hotspot_id)` | Vérifie les actions immédiates |

### Types d'actions

```json
{
  "action_id": "uuid",
  "hotspot_id": "uuid",
  "type": "CREATE_USER",
  "payload": {
    "username": "client-mac-address",
    "password": "generated-password",
    "profile": "1h-10mbps",
    "comment": "Session #1234"
  },
  "created_at": "2026-06-25T10:00:00Z",
  "ttl_seconds": 300
}
```

Types supportés :
- `CREATE_USER` — Créer un utilisateur hotspot (connexion automatique)
- `REMOVE_USER` — Supprimer un utilisateur (session expirée)
- `KICK_SESSION` — Déconnecter un utilisateur (révocation manuelle)

---

## 6. Communication FastAPI ⇄ Java

### Java → FastAPI (appels service)

```
Authentification : X-API-Key (header)
Base URL         : http://localhost:8444
```

Endpoints appelés par Java :
- `POST /api/v1/actions/create` — Créer une action routeur
- `POST /api/v1/hotspots` à `DELETE /api/v1/hotspots/{id}` — CRUD hotspots
- `POST /api/v1/payments/webhook/{operator}` — Forward webhooks
- `POST /api/v1/tickets/activate` — Activer un ticket

### FastAPI → Java (callbacks)

```
Authentification : X-Callback-Secret (header)
Callback URL     : configurable via JAVA_CALLBACK_URL
```

Déclenché quand un routeur confirme l'exécution d'une action.

### Retry sur callbacks

```python
async def notify_java(session_data):
    for attempt in range(3):
        try:
            await httpx.AsyncClient().post(
                java_callback_url,
                json=session_data,
                headers={"X-Callback-Secret": callback_secret},
                timeout=5
            )
            return
        except Exception:
            await asyncio.sleep(2 ** attempt)  # 2s, 4s
```

---

## 7. Système de tokens routeur

Chaque hotspot a un **token unique** qui permet au routeur de s'authentifier.

### Cycle de vie

```
1. Génération : POST /api/v1/hotspots/{id}/generate-token
   → Retourne token + script MikroTik pré-configuré
   → Le script est copié-collé dans le terminal du routeur

2. Utilisation :
   Le routeur inclut le token dans chaque appel Long Polling
   (header X-Router-Token ou query param)

3. Révocation : DELETE /api/v1/hotspots/{id}/router-token
   → Le token est supprimé → le routeur est déconnecté
```

### Statut du hotspot

| Statut | Condition |
|--------|-----------|
| `NO_TOKEN` | Pas de token configuré |
| `NEVER` | Token présent, jamais pingé |
| `ONLINE` | Ping reçu dans les 30 dernières secondes |
| `OFFLINE` | Ping reçu mais > 30 secondes |

---

## 8. API REST complète

### Health

```
GET /health
```

### Hotspots

```
POST   /api/v1/hotspots                          — Créer
GET    /api/v1/hotspots?user_id=                 — Lister (scope utilisateur)
GET    /api/v1/hotspots/all?admin_override=true   — Lister tous (admin)
GET    /api/v1/hotspots/public/{id}               — Infos publiques (portail)
GET    /api/v1/hotspots/{id}?user_id=             — Détail
PUT    /api/v1/hotspots/{id}?user_id=             — Modifier
DELETE /api/v1/hotspots/{id}?user_id=             — Supprimer
POST   /api/v1/hotspots/{id}/test                 — Tester connexion
POST   /api/v1/hotspots/{id}/generate-token        — Générer token routeur
DELETE /api/v1/hotspots/{id}/router-token          — Révoquer token
GET    /api/v1/hotspots/{id}/plans/active          — Forfaits actifs (public)
GET    /api/v1/hotspots/{id}/download-script       — Télécharger script routeur
```

### Routeur (Long Polling)

```
GET  /api/v1/router/{hotspot_id}/pending-actions   — Poller les actions
POST /api/v1/router/{hotspot_id}/actions/{id}/done — Confirmer exécution
GET  /api/v1/agent/router-config                   — Config agent
```

### Actions

```
POST /api/v1/actions/create                        — Créer une action
```

### Paiements

```
POST   /api/v1/payments/initiate                  — Initier
GET    /api/v1/payments/{id}                       — Détail
GET    /api/v1/payments/hotspot/{hotspot_id}        — Par hotspot
POST   /api/v1/payments/webhook/{operator}          — Webhook
POST   /api/v1/payments/{id}/refund                 — Remboursement
GET    /api/v1/payments/validate-hotspot-plan/{hotspot_id}/{plan_id} — Validation
```

### Sessions

```
GET    /api/v1/sessions?hotspot_id=&status=        — Lister
POST   /api/v1/sessions/ping                       — Ping session active
DELETE /api/v1/sessions/{id}/revoke                 — Révoquer
```

### Tickets

```
GET    /api/v1/tickets?hotspot_id=                — Lister
POST   /api/v1/tickets/import                      — Importer (CSV)
POST   /api/v1/tickets/activate                    — Activer
DELETE /api/v1/tickets/{id}                        — Supprimer
DELETE /api/v1/tickets/purge?hotspot_id=            — Purgés
```

### Plans

```
GET    /api/v1/plans?hotspot_id=                  — Lister
POST   /api/v1/plans                               — Créer
PUT    /api/v1/plans/{id}                          — Modifier
DELETE /api/v1/plans/{id}                          — Supprimer
GET    /api/v1/plans/{id}/toggle                   — Activer/désactiver
```

### Admin

```
GET /api/v1/admin/monitoring/router-actions         — Stats file d'attente
GET /api/v1/admin/monitoring/sse-status              — Statut SSE
```

---

## 9. Base de données

### PostgreSQL — `hotspot_fastapi`

### Tables principales

| Table | Description |
|-------|-------------|
| `hotspots` | Configuration des routeurs + tokens |
| `router_actions` | File d'actions (cache, doublon de Redis) |
| `sessions` | Sessions WiFi actives |
| `payments` | Transactions |
| `plans` | Forfaits (source de vérité) |
| `tickets` | Codes prépayés |
| `subscriptions` | Abonnements |

### Migration automatique

Au démarrage, le service exécute automatiquement Alembic :
```python
# database.py
async def run_migrations():
    command.upgrade(alembic_cfg, "head")
```

---

## 10. Agent routeur universel

### `agent/hotspotpay_agent.py`

Un script Python autonome qui peut être déployé **sur le routeur lui-même** (ou un serveur local). Il :

1. Récupère sa configuration via `/api/v1/agent/router-config`
2. Entre en Long Poll vers `/api/v1/router/{id}/pending-actions`
3. Exécute les actions sur le routeur via l'API appropriée
4. Confirme l'exécution via `POST /actions/{id}/done`

### Marques supportées

| Marque | Bibliothèque |
|--------|-------------|
| **MikroTik** | `routeros_api` (API RouterOS) |
| **TP-Link** | Scripts via `tplink.py` |
| **Huawei** | Scripts dédiés |
| **Ubiquiti** | Scripts dédiés |
| **Tenda** | Scripts dédiés |

---

## 11. Scripts MikroTik

Le service génère des scripts pré-configurés pour les routeurs.

### Script typique

```rsc
# Script généré pour Hotspot: MonHotel-WiFi
# Token: abc123...
# Serveur: https://api.hotspotpay.com

/tool fetch url="https://api.hotspotpay.com/api/v1/router/{id}/pending-actions" \
    http-method=get \
    http-header-field="X-Router-Token: abc123..." \
    output=file \
    dst-path=pending.json

:local actions [/file get pending.json contents]
:if ($actions != "null") do={
  # Traiter chaque action...
}
```

### Formats disponibles

| Format | Usage | Extension |
|--------|-------|-----------|
| `bash` | Script shell Linux | `.sh` |
| `rsc` | Script RouterOS natif | `.rsc` |

---

## 12. Configuration

### Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Connexion DB |
| `REDIS_URL` | `redis://localhost:6379/0` | Connexion Redis |
| `API_KEY` | — | Clé API pour appels Java |
| `JAVA_CALLBACK_URL` | `http://localhost:8080/...` | URL callback Java |
| `JAVA_CALLBACK_SECRET` | — | Secret callback |
| `CORS_ORIGINS` | `*` | Origines CORS |
| `LONG_POLL_TIMEOUT` | `10` | Timeout long polling (s) |

---

## 13. Sécurité

| Mesure | Détail |
|--------|--------|
| **API Key** | Tous les endpoints (sauf health + public) vérifient `X-API-Key` |
| **Token routeur** | Chaque hotspot a un token unique pour le Long Polling |
| **Callback secret** | Les callbacks Java sont signés avec un secret partagé |
| **Validation Pydantic** | Tous les inputs sont validés par des schémas stricts |
| **CORS** | Configurable, `*` en dev |

---

> **Documentation générée le 25 juin 2026** — Projet HotspotPay, version HOSPOT-FASTAPI-SERVICE
