# VPS HotspotPay — Configuration & Déploiement

## Informations générales

| Info | Valeur |
|------|--------|
| **IP** | `144.91.105.168` |
| **Hostname** | `vmi3400045` |
| **OS** | Ubuntu 24.04.4 LTS |
| **Stockage** | 144.26 GB |
| **RAM** | 7.8 GiB (+ Swap 4 GB) |
| **Fournisseur** | Contabo |
| **Clé SSH** | `id_ed25519` (dans ce dossier) |

## Connexion

### Avec clé SSH (recommandé)
```powershell
ssh -i "C:\Teda patrick\Hospot\Frontend\hotspotpay-frontend\id_ed25519" root@144.91.105.168
```

### Avec mot de passe
```powershell
ssh root@144.91.105.168
```

## Logiciels installés

| Logiciel | Version | Utilité |
|----------|---------|---------|
| **Docker** | 29.6.1 | Conteneurisation des services |
| **Docker Compose** | v5.2.0 | Orchestration des conteneurs |
| **Nginx** | 1.24.0 | Reverse proxy + serveur statique |
| **Certbot** | - | SSL Let's Encrypt |
| **Git** | 2.43.0 | Clonage des projets |
| **htop / btop** | - | Monitoring temps réel |
| **ncdu** | - | Analyse espace disque |

## Sécurité

### Firewall (UFW)
- **22/tcp** — SSH (avec fail2ban anti brute-force)
- **80/tcp** — HTTP
- **443/tcp** — HTTPS
- **Nginx Full** — UFW profile

Statut : ✅ Actif

### fail2ban
- **Jail SSH** actif, bannissement après 5 tentatives
- IP déjà bannies : `45.148.10.240`, `92.205.50.247`
- Bannissement : 1 heure

### Auto-updates
- `unattended-upgrades` activé
- Mises à jour sécurité automatiques quotidiennes
- Nettoyage automatique tous les 7 jours

### Réseau Docker
```bash
docker network create hotspotpay-network
```
Réseau bridge prêt pour la communication entre conteneurs.

## Statistiques système

```bash
# Monitoring
htop            # temps réel
btop            # version graphique
ncdu /          # analyse disque

# Disque
df -h           # 6.8G utilisé / 145G total

# Mémoire
free -h         # 7.8Gi RAM, 4% utilisé

# Swap
swapon --show   # 4G swap actif
```

## Webhooks — Domaine

Les webhooks Moneroo/Campay fonctionneront avec un nom de domaine pointant vers cette IP.

### Options gratuites :
- **sslip.io** : `hotspotpay.144.91.105.168.sslip.io` (aucune inscription)
- **DuckDNS** : `tonnom.duckdns.org` (gratuit, fiable)
- **No-IP** : `tonnom.ddns.net` (gratuit, confirmation tous les 30 jours)

### Configuration Nginx + SSL (quand tu auras un domaine) :
```bash
# Reverse proxy vers backend Java
nano /etc/nginx/sites-available/hotspotpay

# SSL Let's Encrypt
certbot --nginx -d tondomaine.com
```

## À faire pour déployer HotspotPay

1. Choisir un nom de domaine (gratuit ou payant)
2. Configurer Nginx + SSL
3. Créer `docker-compose.yml` avec :
   - PostgreSQL
   - Redis
   - Backend Java (port 8080)
   - FastAPI (port 8444)
   - Frontend React (build statique)
4. Configurer les variables d'environnement de production
5. Démarrer les conteneurs
6. Tester les webhooks de paiement

## Notes

- **Redémarrage recommandé** : Nouveau noyau 6.8.0-124-generic disponible (en attente)
- **Timezone** : Africa/Douala (WAT, UTC+1)
- **Docker** déjà prêt, plus besoin d'installer quoi que ce soit
- **Commandes utiles** :
  ```bash
  # Voir les logs Docker
  docker logs -f <conteneur>
  
  # Redémarrer Nginx
  systemctl reload nginx
  
  # Voir les IPs bannies par fail2ban
  fail2ban-client status sshd
  
  # Voir les règles UFW
  ufw status numbered
  ```
