#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# HotspotPay — Lancement développement (Git Bash / WSL)
# Charge le .env, démarre le backend Spring Boot
# ══════════════════════════════════════════════════════════════════════════════

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"

# ── 1. Charger le .env ───────────────────────────────────────────────────────
ENV_FILE="$DIR/.env"
if [ -f "$ENV_FILE" ]; then
    echo "📄 Chargement de .env..."
    set -a
    source "$ENV_FILE"
    set +a
    echo "✅ .env chargé"
else
    echo "⚠️  .env introuvable, utilisation des fallbacks"
fi

# ── 2. S'assurer des clés essentielles ───────────────────────────────────────
export JASYPT_KEY="${JASYPT_KEY:-ae9800c5cac2cbc6cc8a3da4a4065a43}"
export FASTAPI_API_KEY="${FASTAPI_API_KEY:-tPkv2JYxU0dniur4MnZB5qteCBJuilUNUA5VhkOEtW0=}"

# ── 3. Lancer Spring Boot ────────────────────────────────────────────────────
echo ""
echo "🚀 Démarrage de HotspotPay..."
echo "   Profil : dev"
echo "   Port   : 8080"
echo ""

cd "$DIR"
./mvnw.cmd spring-boot:run -q -Dspring-boot.run.profiles=dev -DskipTests
