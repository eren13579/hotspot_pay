# HotspotPay — FastAPI Microservice

Microservice FastAPI dédié à la gestion des hotspots MikroTik pour la plateforme HotspotPay.

## Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Service Principal  │  HTTP   │   FastAPI Microservice   │
│   (Java/Spring Boot) │────────▶│   (Ce projet)            │
│                      │  API Key│                          │
│  - Paiements         │         │  - Long Polling          │
│  - Tickets           │         │  - Router Actions Queue  │
│  - Dashboard         │         │  - MikroTik Communication│
└─────────────────────┘         └────────────┬─────────────┘
                                             │
                                    Long Poll│(HTTPS 443)
                                    ~20s timeout
                                             │
                                    ┌────────▼─────────────┐
                                    │   Routeur MikroTik   │
                                    │                      │
                                    │  - /tool fetch GET   │
                                    │  - keep-result=no    │
                                    │  - ACK POST          │
                                    └──────────────────────┘
```

## Flux de connexion client

```
1. Client paie → Service Java valide le paiement
2. Java → FastAPI: POST /api/v1/tickets/activate
3. FastAPI crée action CREATE_USER dans la queue
4. MikroTik → FastAPI: GET /router/{id}/pending-actions (Long Polling)
5. FastAPI répond immédiatement avec l'action (<100ms)
6. MikroTik crée l'utilisateur HotSpot en RAM
7. MikroTik → FastAPI: POST /actions/{id}/done (ACK)
8. Client → MikroTik: http://192.168.88.1/login?username=CODE (bypass React)
```

## Installation

```bash
# Avec Docker
docker-compose up -d

# En local
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8443 --reload
```

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `HOST` | Adresse d'écoute | `0.0.0.0` |
| `PORT` | Port d'écoute | `8443` |
| `DATABASE_URL` | URL base de données | `sqlite+aiosqlite:///./hotspotpay.db` |
| `REDIS_URL` | URL Redis | `redis://localhost:6379/0` |
| `LONG_POLL_TIMEOUT` | Timeout Long Polling (secondes) | `20` |
| `API_KEY` | Clé API pour le service Java | `change-me` |

## API Endpoints

### Health

- `GET /health` — Health check

### Router Long Polling (MikroTik)

- `GET /api/v1/router/{hotspot_id}/pending-actions?token={token}` — Long Polling
- `POST /api/v1/router/{hotspot_id}/actions/{action_id}/done?token={token}` — ACK

### Inter-Service (Java → FastAPI, protégé par API Key)

- `POST /api/v1/tickets/import` — Import de tickets
- `POST /api/v1/tickets/activate` — Activation de ticket (crée action CREATE_USER)
- `POST /api/v1/hotspots/{hotspot_id}/generate-token` — Génération token routeur
- `DELETE /api/v1/hotspots/{hotspot_id}/router-token` — Révocation token

## Tests

```bash
pytest app/tests/ -v
```
