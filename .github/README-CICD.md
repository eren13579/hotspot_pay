# 🔄 HotspotPay — Infrastructure CI/CD

## Architecture monorepo

```
C:\Projet Patrick\              ← racine du dépôt (branche main)
├── Backend/
│   ├── Java/hotspot_pay/       ← Spring Boot (JDK 21, Maven)
│   └── Fastapi/hotspot_pay/    ← FastAPI (Python 3.12)
├── Frontend/hotspot_pay/       ← React 19 (Vite, pnpm)
├── .github/workflows/
│   ├── backend-java.yml        ← CI Java
│   ├── backend-fastapi.yml     ← CI FastAPI
│   ├── frontend.yml            ← CI Frontend
│   └── deploy.yml              ← Déploiement
└── docker-compose.yml          ← Orchestration Docker
```

## Workflows

| Workflow | Déclencheur | Étapes |
|----------|-------------|--------|
| **backend-java.yml** | `Backend/Java/**` modifié | Compile → Test → Docker + Trivy |
| **backend-fastapi.yml** | `Backend/Fastapi/**` modifié | Lint → Test → Docker + Trivy |
| **frontend.yml** | `Frontend/**` modifié | Lint → Build → Docker |
| **deploy.yml** | Push `main` ou manuel | Push images ghcr.io → Staging → Prod |

## 🔧 Secrets GitHub requis

| Secret | Usage |
|--------|-------|
| `DEPLOY_HOST` | IP du serveur |
| `DEPLOY_USER` | Utilisateur SSH |
| `DEPLOY_SSH_KEY` | Clé privée SSH |

## 🚀 Premier push

```bash
cd "C:\Projet Patrick"
git init
git add .
git commit -m "feat: initial monorepo structure"
git remote add origin https://github.com/eren13579/hotspot_pay.git
git push -u origin main --force
```
