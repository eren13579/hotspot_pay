# Guide Docker — HotspotPay

> **Objectif :** Lancer TOUS les services HotspotPay (Java + FastAPI + PostgreSQL + Redis) dans Docker, sans rien installer d'autre que Docker Desktop.

---

## Prérequis

| Logiciel | Où le trouver | Version mini |
|----------|---------------|:------------:|
| **Docker Desktop** | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) | 24+ |

> **Test :** Ouvrez un terminal et tapez `docker --version` et `docker compose version`. Les deux doivent répondre.

---

## Structure des fichiers

Voici les fichiers Docker du projet :

```
C:\Projet Patrick\
│
├── docker-compose.yml          ← LE fichier à utiliser (tous les services)
├── .env.example                ← Exemple de configuration (à copier en .env)
├── init-dbs.sql                ← Crée automatiquement les BDD au 1er démarrage
│
├── Backend\Java\hotspot_pay\
│   ├── Dockerfile              ← Build de l'image Spring Boot
│   └── docker-compose.yml      ← Pour lancer Java SEUL
│
├── Backend\Fastapi\hotspot_pay\
│   ├── Dockerfile              ← Build de l'image FastAPI
│   └── docker-compose.yml      ← Pour lancer FastAPI SEUL
│
└── GUIDE-DOCKER.md             ← Ce fichier
```

---

## 🚀 Méthode 1 : Lancer TOUT (recommandé)

Cette méthode utilise le fichier `C:\Projet Patrick\docker-compose.yml` qui orchestre les 4 services.

### Étape 1 : Configurer les variables d'environnement

```bash
# Depuis C:\Projet Patrick\
cp .env.example .env
```

Ouvrez le fichier `.env` avec un éditeur de texte (Bloc-notes, VS Code, etc.).
Les valeurs par défaut fonctionnent pour le développement, mais vous pouvez les changer :

```env
POSTGRES_PASSWORD=Teda@2003    # Mot de passe PostgreSQL
REDIS_PASSWORD=                 # Laisser vide pour pas de mot de passe Redis
JWT_SECRET=...                  # Clé JWT (min 32 caractères)
JASYPT_KEY=...                  # Clé de chiffrement MikroTik
FASTAPI_API_KEY=...             # Clé API entre Java et FastAPI
FASTAPI_CALLBACK_SECRET=...     # Secret pour les callbacks FastAPI→Java
BASE_URL=http://localhost:8080   # URL publique
```

### Étape 2 : Lancer tous les services

```bash
# Depuis C:\Projet Patrick\
docker compose up -d
```

**Premier lancement uniquement :** Docker va télécharger les images (PostgreSQL 16, Redis 7) et builder les images Java et FastAPI. Cela prend **5 à 10 minutes** la première fois.

### Étape 3 : Vérifier que tout est ok

```bash
# Voir l'état des conteneurs
docker compose ps

# Voir les logs (appuyez sur Ctrl+C pour quitter)
docker compose logs -f

# Vérifier le health check Java
curl http://localhost:8080/api/V1/actuator/health

# Vérifier le health check FastAPI
curl http://localhost:8444/health
```

Vous devriez voir ceci :

```
NAME                   STATUS              PORTS
hotspotpay-postgres    Up (healthy)        0.0.0.0:5432->5432/tcp
hotspotpay-redis       Up (healthy)        0.0.0.0:6379->6379/tcp
hotspotpay-java        Up (healthy)        0.0.0.0:8080->8080/tcp
hotspotpay-fastapi     Up (healthy)        0.0.0.0:8444->8444/tcp
```

### Résultat

| Service | URL |
|---------|:---:|
| **API Java (Spring Boot)** | [http://localhost:8080/api/V1](http://localhost:8080/api/V1) |
| **Swagger Java** | [http://localhost:8080/api/V1/swagger-ui.html](http://localhost:8080/api/V1/swagger-ui.html) |
| **API FastAPI** | [http://localhost:8444](http://localhost:8444) |
| **Swagger FastAPI** | [http://localhost:8444/docs](http://localhost:8444/docs) |
| **PostgreSQL** | `localhost:5432` (user: `postgres`, pass: voir `.env`) |
| **Redis** | `localhost:6379` |

---

## 🏃 Méthode 2 : Lancer Java SEUL (avec DB + Redis)

Si vous travaillez uniquement sur le backend Java :

```bash
# Depuis C:\Projet Patrick\Backend\Java\hotspot_pay\
docker compose up -d
```

Cela lance : Java (port 8080) + PostgreSQL (port 5432) + Redis (port 6379)

---

## 🏃 Méthode 3 : Lancer FastAPI SEUL (avec DB + Redis)

Si vous travaillez uniquement sur le microservice FastAPI :

```bash
# Depuis C:\Projet Patrick\Backend\Fastapi\hotspot_pay\
docker compose up -d
```

Cela lance : FastAPI (port 8444) + PostgreSQL (port **5433**) + Redis (port **6380**)

> **Note :** PostgreSQL est sur le port 5433 (pas 5432) pour éviter les conflits si vous avez aussi le Java qui tourne. Redis est sur le port 6380.

---

## ⚙️ Commandes utiles

### Gestion des conteneurs

```bash
# Tout lancer en arrière-plan
docker compose up -d

# Tout arrêter (les conteneurs restent)
docker compose stop

# Tout arrêter et supprimer les conteneurs
docker compose down

# Tout arrêter et supprimer AUSSI les bases de données
docker compose down -v          # ⚠️ ATTENTION : efface toutes les données !

# Redémarrer un service spécifique
docker compose restart backend-java

# Voir les logs d'un service
docker compose logs -f backend-fastapi
```

### Reconstruire après modification du code

```bash
# Rebuild une image et relancer
docker compose build backend-java
docker compose up -d

# Ou en une seule commande
docker compose up -d --build
```

### Accéder aux bases de données

```bash
# Connexion PostgreSQL
docker exec -it hotspotpay-postgres psql -U postgres -d hotspot_pay

# Lister les bases
docker exec -it hotspotpay-postgres psql -U postgres -c "\l"

# Connexion Redis
docker exec -it hotspotpay-redis redis-cli
```

---

## 🐛 Debug : Si quelque chose ne marche pas

### Problème : "Port already in use" (port déjà utilisé)

Si vous avez déjà des services qui tournent sur les ports 5432, 6379, 8080 ou 8444 :

```bash
# Vérifier ce qui utilise le port
netstat -ano | findstr :8080

# Arrêter le processus ou changer de port
# Sinon, arrêter d'abord les services locaux avec :
net stop postgresql-x64-16   # (Exemple pour PostgreSQL Windows)
```

### Problème : Le conteneur Java ne démarre pas

```bash
# Voir les logs Java
docker compose logs backend-java

# Erreur typique : "Connection to postgres:5432 refused"
# → PostgreSQL n'est pas encore prêt. Attendez 30s et réessayez.
# Les services ont depends_on: condition: service_healthy, donc ils attendent.

# Vérifier que PostgreSQL est healthy
docker compose ps postgres
```

### Problème : "No such file or directory" pour Maven

Si le build Java échoue avec une erreur Maven :

```bash
# Vérifier que les fichiers Maven wrapper existent
dir C:\Projet Patrick\Backend\Java\hotspot_pay\.mvn\
dir C:\Projet Patrick\Backend\Java\hotspot_pay\mvnw
```

Si `mvnw` manque (mais que `.mvn/` existe), il faut le générer :

```bash
cd C:\Projet Patrick\Backend\Java\hotspot_pay
mvn -N wrapper:wrapper
```

> **Solution de contournement :** Utilisez Maven directement (si installé) en modifiant le `pom.xml` ou le Dockerfile pour remplacer `./mvnw` par `mvn`.

### Problème : "relation does not exist" ou erreur Flyway

Le schéma de base de données doit être créé par Flyway :

```bash
# Forcer la réparation Flyway (si des migrations ont déjà été appliquées)
docker exec hotspotpay-java curl -X POST http://localhost:8080/api/V1/actuator/flyway

# Si rien ne marche : supprimer les volumes et recommencer
docker compose down -v
docker compose up -d
```

### Problème : FastAPI ne trouve pas la base hotspot_fastapi

```bash
# Vérifier que la DB a été créée
docker exec hotspotpay-postgres psql -U postgres -c "\l"

# Si hotspot_fastapi n'existe pas, la créer manuellement
docker exec hotspotpay-postgres psql -U postgres -c "CREATE DATABASE hotspot_fastapi;"
```

### Problème : Windows partage de fichiers (bind mounts)

Sur Windows, Docker Desktop peut avoir des problèmes de permissions avec les bind mounts. Si vous voyez des erreurs de permission, essayez :

```bash
# Partager le disque C: dans Docker Desktop
# Docker Desktop → Settings → Resources → File Sharing → Ajouter C:\
```

---

## 🔄 Workflow de développement typique

### Situation 1 : Je modifie du code Java et je veux tester

```bash
# 1. Arrêter le service Java (la DB et Redis restent allumés)
docker compose stop backend-java

# 2. Rebuild et relancer
docker compose up -d --build backend-java

# 3. Voir les logs
docker compose logs -f backend-java
```

### Situation 2 : Je modifie du code FastAPI

```bash
# Rebuild et relancer FastAPI
docker compose up -d --build backend-fastapi
```

### Situation 3 : Je veux travailler sur les 2 backends

```bash
# Lancer DB + Redis d'abord
docker compose up -d postgres redis

# Puis lancer les backends quand je suis prêt
docker compose up -d backend-java backend-fastapi
```

### Situation 4 : Je veux développer sans Docker

Vous pouvez aussi lancer les services directement (sans Docker) :

```bash
# 1. PostgreSQL doit tourner (service Windows ou Docker)
# 2. Redis doit tourner
# 3. Lancer FastAPI :
cd C:\Projet Patrick\Backend\Fastapi\hotspot_pay
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8444 --reload

# 4. Lancer Java :
cd C:\Projet Patrick\Backend\Java\hotspot_pay
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

---

## 📦 Résumé des dépendances entre services

```
                ┌──────────┐
                │  Redis   │
                └────┬─────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
┌──────────┐  ┌──────────┐  ┌──────────────┐
│  Java    │  │ FastAPI  │  │   Frontend   │
│  :8080   │  │  :8444   │  │   :5173     │
└────┬─────┘  └────┬─────┘  └──────┬───────┘
     │              │               │
     └──────────────┼───────────────┘
                    ▼
            ┌──────────────┐
            │  PostgreSQL   │
            │  :5432        │
            │               │
            │  - hotspot_pay      (Java)
            │  - hotspot_fastapi  (FastAPI)
            └──────────────┘
```

---

## 🔗 Liens utiles

| Ressource | URL |
|-----------|:---:|
| Docker Desktop | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) |
| Documentation Docker Compose | [docs.docker.com/compose](https://docs.docker.com/compose/) |
| Spring Boot Docker | [spring.io/guides/gs/spring-boot-docker](https://spring.io/guides/gs/spring-boot-docker/) |
| FastAPI Docker | [fastapi.tiangolo.com/deployment/docker](https://fastapi.tiangolo.com/deployment/docker/) |
