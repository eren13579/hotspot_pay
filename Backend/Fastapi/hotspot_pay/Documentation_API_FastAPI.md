# 📘 Documentation API HotspotPay — Service FastAPI

**Version :** 1.0.0
**Base URL :** `http://localhost:8444` (développement)
**Base de données :** PostgreSQL `hotspot_fastapi`

---

## 🔐 Authentification — Comment ça marche

Le service FastAPI utilise **deux types d'authentification** selon qui appelle :

```
┌─────────────────────────────────────────────────────────────┐
│                    QUI APPELLE ?                            │
├──────────────────────┬──────────────────────────────────────┤
│  Service Java        │  Header: X-API-Key                   │
│  (inter-service)     │  Valeur: dev-api-key-change-in-      │
│                      │           production                 │
├──────────────────────┼──────────────────────────────────────┤
│  Routeur MikroTik    │  Header: X-Router-Token              │
│  (agent routeur)     │  OU Query param: ?token=XXX          │
│                      │  Valeur: token généré par le hotspot │
└──────────────────────┴──────────────────────────────────────┘
```

### Où trouver chaque valeur ?

| Valeur | Où la trouver | Exemple |
|--------|--------------|---------|
| **X-API-Key** | Fichier `.env` du projet FastAPI, variable `API_KEY` | `dev-api-key-change-in-production` |
| **X-Router-Token** | Généré via `POST /hotspots/{id}/generate-token` — stocké dans la DB du hotspot | `a1b2c3d4e5f6...` |
| **user_id** | UUID retourné par le service Java après inscription/connexion | `1d4edebd-5f23-43bd-b63d-26ec54253779` |

---

## 📍 Endpoints EXEMPTÉS d'authentification (aucune clé requise)

Ces URLs sont accessibles **sans aucun header d'auth** :

| Méthode | URL | Description |
|---------|-----|-------------|
| `GET` | `/` | Page racine du service |
| `GET` | `/health` | Health check basique |
| `GET` | `/health/health/ready` | Vérifie DB + Redis |
| `GET` | `/docs` | Documentation Swagger (ouverte) |
| `GET` | `/redoc` | Documentation ReDoc (ouverte) |
| `GET` | `/openapi.json` | Schéma OpenAPI |

---

## 🔑 Endpoints protégés par X-API-Key (appels Java → FastAPI)

**À ajouter dans CHAQUE requête :**
```
X-API-Key: dev-api-key-change-in-production
```

### 1. Hotspots

| Méthode | URL | Description | Paramètres obligatoires |
|---------|-----|-------------|------------------------|
| `POST` | `/api/v1/hotspots` | Créer un hotspot | `user_id` + body JSON |
| `GET` | `/api/v1/hotspots` | Lister les hotspots d'un user | `user_id` (query) |
| `GET` | `/api/v1/hotspots/{hotspot_id}` | Récupérer un hotspot | `user_id` (query) |
| `PUT` | `/api/v1/hotspots/{hotspot_id}` | Mettre à jour un hotspot | `user_id` (query) |
| `DELETE` | `/api/v1/hotspots/{hotspot_id}` | Supprimer un hotspot | `user_id` (query) |
| `POST` | `/api/v1/hotspots/{hotspot_id}/test` | Tester la connexion | `user_id` (query) |
| `POST` | `/api/v1/hotspots/{hotspot_id}/generate-token` | Générer token routeur + script | `user_id` (query) |
| `DELETE` | `/api/v1/hotspots/{hotspot_id}/router-token` | Révoquer le token routeur | `user_id` (query) |

#### Créer un hotspot — Exemple complet

```http
POST /api/v1/hotspots
X-API-Key: dev-api-key-change-in-production
Content-Type: application/json

{
    "user_id": "1d4edebd-5f23-43bd-b63d-26ec54253779",
    "name": "Mon Hotspot",
    "location": "Douala, Cameroun",
    "mikrotik_ip": "192.168.1.1",
    "mikrotik_port": 8728,
    "mikrotik_user": "admin",
    "mikrotik_password": "secret123",
    "hotspot_profile": "default",
    "router_brand": "mikrotik"
}
```

#### Lister les hotspots — Exemple

```http
GET /api/v1/hotspots?user_id=1d4edebd-5f23-43bd-b63d-26ec54253779&skip=0&limit=20
X-API-Key: dev-api-key-change-in-production
```

#### Générer le token routeur — Exemple

```http
POST /api/v1/hotspots/88468237-6a51-462b-a6af-3d2e8391be1a/generate-token?user_id=1d4edebd-5f23-43bd-b63d-26ec54253779
X-API-Key: dev-api-key-change-in-production
```

**Réponse :**
```json
{
    "success": true,
    "router_token": "a1b2c3d4e5f6...",
    "polling_url": "http://localhost:8444/api/v1/router/88468237-.../pending-actions",
    "script_download_url": "http://localhost:8444/api/v1/hotspots/.../download-script?token=...&brand=mikrotik&format=bash"
}
```

> ⚠️ **Ce `router_token` est le `X-Router-Token`** que le routeur MikroTik utilisera pour s'authentifier.

---

### 2. Tickets (import/activation)

| Méthode | URL | Description |
|---------|-----|-------------|
| `POST` | `/api/v1/tickets/import` | Importer des tickets pré-générés |
| `POST` | `/api/v1/tickets/activate` | Activer un ticket existant |
| `POST` | `/api/v1/tickets/activate-activer des credentials à la volée |

#### Importer des tickets

```http
POST /api/v1/tickets/import
X-API-Key: dev-api-key-change-in-production
Content-Type: application/json

{
    "hotspot_id": "88468237-6a51-462b-a6af-3d2e8391be1a",
    "tickets": [
        {"username": "TKT001", "password": "pass1", "time_limit": "1h"},
        {"username": "TKT002", "password": "pass2", "time_limit": "2h"}
    ]
}
```

---

### 3. Actions Routeur

| Méthode | URL | Description |
|---------|-----|-------------|
| `POST` | `/api/v1/router/actions/create` | Créer une action pour le routeur |

#### Créer une action

```http
POST /api/v1/router/actions/create
X-API-Key: dev-api-key-change-in-production
Content-Type: application/json

{
    "hotspot_id": "88468237-6a51-462b-a6af-3d2e8391be1a",
    "action_type": "CREATE_USER",
    "username": "TKT001",
    "password": "pass1",
    "profile": "default",
    "time_limit": "1h"
}
```

---

### 4. Marques et modèles de routeurs

| Méthode | URL | Description |
|---------|-----|-------------|
| `GET` | `/api/v1/router-brands` | Lister les marques (5 marques) |
| `GET` | `/api/v1/router-brands/mikrotik` | Détail d'une marque |
| `GET` | `/api/v1/router-brands/mikrotik/models` | Modèles d'une marque |

---

## 📡 Endpoints protégés par X-Router-Token (appels Routeur MikroTik)

**Pour le routeur MikroTik (agent bash/rsc) — s'authentifie avec le token du hotspot :**
```
X-Router-Token: <router_token_ici>
```
**OU via query parameter :**
```
?token=<router_token_ici>
```

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| `GET` | `/api/v1/router/{hotspot_id}/pending-actions?token=XXX` | Router-Token | **Long Polling** — le routeur attend des actions (10s max) |
| `POST` | `/api/v1/router/{hotspot_id}/actions/{action_id}/done?token=XXX` | Router-Token | **ACK** — confirme l'exécution d'une action |
| `GET` | `/api/v1/hotspots/{hotspot_id}/download-script?token=XXX` | Router-Token | Télécharge le script bash/rsc pré-configuré |
| `GET` | `/api/v1/hotspots/{hotspot_id}/script-info?token=XXX` | Router-Token | Infos du script sans le télécharger |
| `GET` | `/api/v1/router/agent/router-config?token=XXX` | Router-Token | Configuration complète du routeur |

### Comment le routeur s'authentifie — Exemple

```bash
# Le routeur MikroTik (script bash) appelle :
ROUTER_TOKEN="a1b2c3d4e5f6..."
HOTSPOT_ID="88468237-6a51-462b-a6af-3d2e8391be1a"

# Long Polling — attend des actions
curl -H "X-Router-Token: $ROUTER_TOKEN" \
     "http://localhost:8444/api/v1/router/$HOTSPOT_ID/pending-actions"

# Après avoir exécuté une action → ACK
curl -X POST -H "X-Router-Token: $ROUTER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"success": true}' \
     "http://localhost:8444/api/v1/router/$HOTSPOT_ID/actions/abc123/done"

# Télécharger le script pré-configuré
curl -H "X-Router-Token: $ROUTER_TOKEN" \
     "http://localhost:8444/api/v1/hotspots/$HOTSPOT_ID/download-script?token=$ROUTER_TOKEN&brand=mikrotik&format=bash"
```

---

## 📋 Récapitulatif des headers

```
┌──────────────────────────────────────────────────────────────────────┐
│ RAPIDE — Quel header pour quel endpoint ?                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Appels Java → FastAPI (CRUD hotspots, tickets, actions) :         │
│    X-API-Key: dev-api-key-change-in-production                      │
│                                                                      │
│  Appels Routeur MikroTik → FastAPI (polling, ACK, scripts) :       │
│    X-Router-Token: <token_du_hotspot>                               │
│                                                                      │
│  Endpoints publics (health, docs) :                                  │
│    Aucun header requis                                               │
│                                                                      │
│  Le user_id :                                                        │
│    Toujours en query param sur les routes /hotspots/*               │
│    Ex: ?user_id=1d4edebd-5f23-43bd-b63d-26ec54253779               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Tester avec cURL — Guide rapide

```powershell
# Variables
$API_KEY = "dev-api-key-change-in-production"
$USER_ID = "1d4edebd-5f23-43bd-b63d-26ec54253779"
$BASE = "http://localhost:8444"

# 1. Health check (pas d'auth)
curl "$BASE/health"

# 2. Créer un hotspot (auth X-API-Key)
curl -X POST "$BASE/api/v1/hotspots" `
  -H "X-API-Key: $API_KEY" `
  -H "Content-Type: application/json" `
  -d '{"user_id":"'$USER_ID'","name":"Test","location":"Douala"}'

# 3. Lister les hotspots (auth X-API-Key)
curl "$BASE/api/v1/hotspots?user_id=$USER_ID" `
  -H "X-API-Key: $API_KEY"

# 4. Générer token routeur (auth X-API-Key)
# Remplace <HOTSPOT_ID> par l'ID retourné à l'étape 2
curl -X POST "$BASE/api/v1/hotspots/<HOTSPOT_ID>/generate-token?user_id=$USER_ID" `
  -H "X-API-Key: $API_KEY"

# 5. Router Long Polling (auth X-Router-Token — PAS X-API-Key)
# Remplace <ROUTETOKEN> par le token de l'étape 4
curl "$BASE/api/v1/router/<HOTSPOT_ID>/pending-actions" `
  -H "X-Router-Token: <ROUTER_TOKEN>"
```

---

## ⚠️ Erreurs courantes

| Code | Cause | Solution |
|------|-------|----------|
| `401` | Header `X-API-Key` manquant ou incorrect | Vérifier le `.env` → variable `API_KEY` |
| `401` | Header `X-Router-Token` manquant (routes routeur) | Le routeur doit envoyer le token dans le header ou query param `token` |
| `403` | Token routeur invalide | Regénérer via `POST /hotspots/{id}/generate-token` |
| `403` | JWT invalide (côté Java) | Le Java vérifie le JWT, pas le FastAPI |
| `404` | Hotspot introuvable ou `user_id` ne correspond pas | Vérifier l'ID du hotspot et le `user_id` |
| `422` | Body JSON mal formaté | Vérifier les champs obligatoires du schéma |

---

## 🔧 Fichier .env — Configuration

```
# Fichier: F:\Teda patrick\HOSPOT-FASTAPI-SERVICE\.env

DB_PASSWORD=Teda@2003
API_KEY=dev-api-key-change-in-production
```

---

## 🚀 Lancement du service

```powershell
# Activer l'environnement virtuel
cd "F:\Teda patrick\HOSPOT-FASTAPI-SERVICE"
& ".\.venv\Scripts\Activate.ps1"

# Lancer le serveur
uvicorn app.main:app --host 0.0.0.0 --port 8444
```

**Swagger UI interactive :** http://localhost:8444/docs
