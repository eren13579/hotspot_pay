#!/bin/bash
# ==============================================================
# HotspotPay — Seed de données de test via les APIs REST
# ==============================================================
# Prérequis : les 4 conteneurs Docker doivent tourner
#   docker compose -f "C:/Projet Patrick/docker-compose.yml" ps
#
# Usage :
#   bash seed_via_api.sh
# ==============================================================

set -e

BASE_JAVA="http://localhost:8080/api/V1"
BASE_FASTAPI="http://localhost:8444"
PASSWORD="Made@2006"

echo "=========================================="
echo "  HOTSPOTPAY — Seed Test Data via API"
echo "=========================================="
echo ""

# ─── ÉTAPE 1 : Login admin → JWT ────────────────────────────
echo "🔑 Login admin..."
ADMIN_LOGIN=$(curl -s -X POST "$BASE_JAVA/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"tedapatrick4@gmail.com\", \"password\": \"$PASSWORD\"}")
echo "$ADMIN_LOGIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ✓ Token:', d.get('accessToken','?')[:50]+'...')" 2>/dev/null || echo "  ✗ Échec login"
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
if [ -z "$ADMIN_TOKEN" ]; then
  echo "  ✗ Impossible d'obtenir le token admin"
  exit 1
fi

# ─── ÉTAPE 2 : Inscrire des utilisateurs de test ────────────
echo ""
echo "👤 Création des utilisateurs de test..."

declare -A TEST_USERS
TEST_USERS["admin@hotspotpay.com"]='{"email":"admin@hotspotpay.com","phone":"+237671234567","password":"Made@2006","fullName":"Admin Test"}'
TEST_USERS["reseller@hotspotpay.com"]='{"email":"reseller@hotspotpay.com","phone":"+237698765432","password":"Made@2006","fullName":"Reseller Test"}'
TEST_USERS["user@hotspotpay.com"]='{"email":"user@hotspotpay.com","phone":"+237655443322","password":"Made@2006","fullName":"User Test"}'

for email in "${!TEST_USERS[@]}"; do
  BODY="${TEST_USERS[$email]}"
  RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_JAVA/auth/register" \
    -H "Content-Type: application/json" \
    -d "$BODY")
  if [ "$RESP" = "200" ] || [ "$RESP" = "201" ]; then
    echo "  ✓ $email créé"
  elif [ "$RESP" = "409" ] || [ "$RESP" = "400" ]; then
    echo "  ~ $email existe déjà (HTTP $RESP)"
  else
    echo "  ✗ $email → HTTP $RESP"
  fi
done

# ─── ÉTAPE 3 : Login admin frais pour récupérer JWT à jour ──
echo ""
echo "🔄 Rafraîchissement JWT admin..."
ADMIN_JWT=$(curl -s -X POST "$BASE_JAVA/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"tedapatrick4@gmail.com\", \"password\": \"$PASSWORD\"}" | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
echo "  ✓ Token admin récupéré"
AUTH="Authorization: Bearer $ADMIN_JWT"

# ─── ÉTAPE 4 : Créer des hotspots ───────────────────────────
echo ""
echo "📡 Création des hotspots..."

declare -A HOTSPOTS
HOTSPOTS["Boutique Express Douala"]='{"name":"Boutique Express Douala","location":"Douala, Bonanjo","mikrotikIp":"192.168.88.1","mikrotikPort":8728,"mikrotikUser":"admin","mikrotikPassword":"router123","routerBrand":"MikroTik","routerType":"hAP AC2"}'
HOTSPOTS["Café Numérique Yaoundé"]='{"name":"Café Numérique Yaoundé","location":"Yaoundé, Mvog-Mbi","mikrotikIp":"10.0.0.1","mikrotikPort":8728,"mikrotikUser":"admin","mikrotikPassword":"router456","routerBrand":"MikroTik","routerType":"RB951"}'
HOTSPOTS["Hub Cyber Bafoussam"]='{"name":"Hub Cyber Bafoussam","location":"Bafoussam, Centre Ville","mikrotikIp":"172.16.0.1","mikrotikPort":8728,"mikrotikUser":"reseller","mikrotikPassword":"hub789","routerBrand":"MikroTik","routerType":"RB750Gr3"}'

declare -A HOTSPOT_IDS
for name in "${!HOTSPOTS[@]}"; do
  BODY="${HOTSPOTS[$name]}"
  RESP=$(curl -s -X POST "$BASE_JAVA/hotspots" \
    -H "Content-Type: application/json" \
    -H "$AUTH" \
    -d "$BODY")
  HOTSPOT_ID=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('hotspotId','?'))" 2>/dev/null)
  HTTP_CODE=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',200))" 2>/dev/null || echo "?")
  if [ "$HOTSPOT_ID" != "?" ] && [ -n "$HOTSPOT_ID" ]; then
    echo "  ✓ $name → $HOTSPOT_ID"
    HOTSPOT_IDS["$name"]="$HOTSPOT_ID"
  else
    # Peut-être existe déjà — on essaie de le récupérer
    echo "  ~ $name : $RESP" | python3 -c "import sys; print(sys.stdin.read()[:120])" 2>/dev/null || echo "  ~ $name (exist already?)"
  fi
done

# ─── ÉTAPE 5 : Récupérer les hotspot_ids depuis l'API ──────
echo ""
echo "🔍 Récupération des hotspots existants..."
HOTSPOTS_JSON=$(curl -s "$BASE_JAVA/hotspots?scope=all&size=20" -H "$AUTH")
echo "$HOTSPOTS_JSON" | python3 -c "
import sys,json
try:
  data = json.load(sys.stdin)
  items = data.get('content', data if isinstance(data, list) else [data])
  for h in items:
    if isinstance(h, dict) and 'hotspotId' in h and 'name' in h:
      print(f'  • {h[\"hotspotId\"]} — {h[\"name\"]}')
except Exception as e:
  print(f'  (parse error: {e})')
" 2>/dev/null || echo "  (no hotspots found)"

# Extraire les hotspot_ids
HOTSPOT_IDS=$(echo "$HOTSPOTS_JSON" | python3 -c "
import sys,json
try:
  data = json.load(sys.stdin)
  items = data.get('content', data if isinstance(data, list) else [data])
  if isinstance(items, dict): items = [items]
  for h in items:
    if isinstance(h, dict) and 'hotspotId' in h:
      print(h['hotspotId'], h.get('name',''))
except: pass
" 2>/dev/null)

# ─── ÉTAPE 6 : Créer des plans pour chaque hotspot ──────────
echo ""
echo "📋 Création des forfaits..."

PLANS_BOUTIQUE='[
  {"name":"1 Heure","durationMinutes":60,"price":500,"currency":"XAF","downloadSpeedKbps":1024,"uploadSpeedKbps":512,"displayOrder":1,"hotspotProfile":"default"},
  {"name":"3 Heures","durationMinutes":180,"price":1000,"currency":"XAF","downloadSpeedKbps":1024,"uploadSpeedKbps":512,"displayOrder":2,"hotspotProfile":"default"},
  {"name":"1 Jour","durationMinutes":1440,"price":2000,"currency":"XAF","downloadSpeedKbps":2048,"uploadSpeedKbps":1024,"dataLimitMb":500,"displayOrder":3},
  {"name":"1 Semaine","durationMinutes":10080,"price":5000,"currency":"XAF","downloadSpeedKbps":4096,"uploadSpeedKbps":2048,"dataLimitMb":2000,"displayOrder":4},
  {"name":"1 Mois","durationMinutes":43200,"price":15000,"currency":"XAF","downloadSpeedKbps":8192,"uploadSpeedKbps":4096,"displayOrder":5}
]'

PLANS_CAFE='[
  {"name":"1 Heure","durationMinutes":60,"price":300,"currency":"XAF","downloadSpeedKbps":512,"uploadSpeedKbps":256,"displayOrder":1},
  {"name":"3 Heures","durationMinutes":180,"price":700,"currency":"XAF","downloadSpeedKbps":1024,"uploadSpeedKbps":512,"displayOrder":2},
  {"name":"1 Jour","durationMinutes":1440,"price":1500,"currency":"XAF","downloadSpeedKbps":2048,"uploadSpeedKbps":1024,"dataLimitMb":300,"displayOrder":3}
]'

PLANS_HUB='[
  {"name":"1 Heure","durationMinutes":60,"price":400,"currency":"XAF","downloadSpeedKbps":1024,"uploadSpeedKbps":512,"displayOrder":1},
  {"name":"1 Jour","durationMinutes":1440,"price":1500,"currency":"XAF","downloadSpeedKbps":2048,"uploadSpeedKbps":1024,"dataLimitMb":400,"displayOrder":2},
  {"name":"1 Semaine","durationMinutes":10080,"price":4000,"currency":"XAF","downloadSpeedKbps":4096,"uploadSpeedKbps":2048,"dataLimitMb":1500,"displayOrder":3},
  {"name":"1 Mois","durationMinutes":43200,"price":12000,"currency":"XAF","downloadSpeedKbps":8192,"uploadSpeedKbps":4096,"displayOrder":4}
]'

echo "$HOTSPOT_IDS" | while read -r hid hname; do
  [ -z "$hid" ] && continue
  case "$hname" in
    *Boutique*) PLANS="$PLANS_BOUTIQUE" ;;
    *Café*|*Yaoundé*) PLANS="$PLANS_CAFE" ;;
    *Hub*|*Bafoussam*) PLANS="$PLANS_HUB" ;;
    *) PLANS="$PLANS_BOUTIQUE" ;;
  esac
  echo "$PLANS" | python3 -c "import sys,json; plans=json.load(sys.stdin); [print(p['name']) for p in plans]" 2>/dev/null | while read -r pname; do
    PLAN_BODY=$(echo "$PLANS" | python3 -c "import sys,json; plans=json.load(sys.stdin); print(json.dumps([p for p in plans if p['name']=='$pname'][0]))" 2>/dev/null)
    RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_JAVA/hotspots/$hid/plans" \
      -H "Content-Type: application/json" \
      -H "$AUTH" \
      -d "$PLAN_BODY")
    if [ "$RESP" = "200" ] || [ "$RESP" = "201" ]; then
      echo "  ✓ $hname → $pname"
    elif [ "$RESP" = "409" ] || [ "$RESP" = "400" ]; then
      echo "  ~ $hname → $pname existe déjà"
    else
      echo "  ✗ $hname → $pname → HTTP $RESP"
    fi
  done
done

echo ""
echo "=========================================="
echo "  ✅ DONNÉES DE TEST CRÉÉES AVEC SUCCÈS"
echo "=========================================="
echo ""
echo "Comptes de test :"
echo "  Admin    : tedapatrick4@gmail.com / $PASSWORD"
echo "  Admin2   : admin@hotspotpay.com / $PASSWORD"
echo "  Reseller : reseller@hotspotpay.com / $PASSWORD"
echo "  User     : user@hotspotpay.com / $PASSWORD"
echo ""
echo "URLs :"
echo "  Swagger Java   : http://localhost:8080/api/V1/swagger-ui.html"
echo "  Swagger FastAPI: http://localhost:8444/docs"
echo ""
