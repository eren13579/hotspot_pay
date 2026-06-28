#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# HotspotPay — Génération des secrets pour la production
# Exécuter UNE SEULE FOIS lors de la configuration initiale.
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

echo "╔══════════════════════════════════════════════════════╗"
echo "║     HotspotPay — Génération des secrets prod        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── JWT Secret (64 chars base64) ─────────────────────────────────────────────
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# ── Jasypt Key (16 bytes hex) ────────────────────────────────────────────────
JASYPT_KEY=$(openssl rand -hex 16)
echo "JASYPT_KEY=$JASYPT_KEY"
echo ""

# ── FastAPI API Key (32 bytes URL-safe base64) ───────────────────────────────
FASTAPI_API_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
echo "FASTAPI_API_KEY=$FASTAPI_API_KEY"
echo ""

# ── FastAPI Callback Secret (32 bytes hex) ───────────────────────────────────
FASTAPI_CALLBACK_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
echo "FASTAPI_CALLBACK_SECRET=$FASTAPI_CALLBACK_SECRET"
echo ""

# ── Résumé ───────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Variables à définir dans l'environnement           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "# ── Backend Java (application.properties) ──"
echo "JWT_SECRET=$JWT_SECRET"
echo "JASYPT_KEY=$JASYPT_KEY"
echo "FASTAPI_API_KEY=$FASTAPI_API_KEY"
echo "FASTAPI_CALLBACK_SECRET=$FASTAPI_CALLBACK_SECRET"
echo ""
echo "# ── FastAPI (.env) ──"
echo "API_KEY=$FASTAPI_API_KEY"
echo "JAVA_CALLBACK_SECRET=$FASTAPI_CALLBACK_SECRET"
echo ""
echo "# ── Autres à configurer manuellement ──"
echo "- Campay : CAMPAY_USERNAME, CAMPAY_PASSWORD (depuis campay.net)"
echo "- Moneroo : MONEROO_API_KEY (depuis moneroo.io)"
echo "- SMTP : MAIL_HOST, MAIL_USERNAME, MAIL_PASSWORD"
echo "- Google OAuth : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (console.cloud.google.com)"
echo "- Domaine : BASE_URL=https://votre-domaine.com/api/V1"
echo "- Frontend : CORS_ALLOWED_ORIGINS=https://votre-frontend.com"
echo ""
echo "⚠️  Conservez ces valeurs dans un gestionnaire de mots de passe !"
echo "   Elles ne peuvent PAS être récupérées si perdues."
