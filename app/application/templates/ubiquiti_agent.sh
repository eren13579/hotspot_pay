#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
# HOTSPOTPAY — AGENT UBIQUITI UNIFI (AUTO-GENERE)
# ═══════════════════════════════════════════════════════
# Hotspot ......... __HOTSPOT_ID__
# Genere le ....... __GENERATED_AT__
# ═══════════════════════════════════════════════════════
# INSTALLATION :
#   1. Configurer les variables ROUTEUR ci-dessous
#   2. chmod +x hotspotpay-ubiquiti-agent.sh
#   3. ./hotspotpay-ubiquiti-agent.sh &
# ═══════════════════════════════════════════════════════

# ── CONFIGURATION AUTO-GENEREE ──
HOTSPOT_ID="__HOTSPOT_ID__"
ROUTER_TOKEN="__ROUTER_TOKEN__"
POLLING_URL="__POLLING_URL__"
ACK_BASE_URL="__ACK_BASE_URL__"
POLL_INTERVAL=15

# ── CONFIGURATION ROUTEUR ──
ROUTEUR_IP="192.168.1.1"
ROUTEUR_PORT=8443
UNIFI_USER="admin"
UNIFI_PASS=""

# ── FONCTIONS ──
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [HotspotPay] $1"; }

# Cookie jar pour l'authentification UniFi
COOKIE_JAR="/tmp/hotspotpay_unifi_cookies.txt"

authentifier_unifi() {
    curl -sk -c "$COOKIE_JAR" -X POST \
        "https://${ROUTEUR_IP}:${ROUTEUR_PORT}/api/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${UNIFI_USER}\",\"password\":\"${UNIFI_PASS}\"}" > /dev/null 2>&1
}

creer_utilisateur() {
    local user="$1" pass="$2" profile="${3:-default}"
    authentifier_unifi
    curl -sk -b "$COOKIE_JAR" -X POST \
        "https://${ROUTEUR_IP}:${ROUTEUR_PORT}/api/s/default/rest/user" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$user\",\"note\":\"HotspotPay-$user\"}"
    log "CREE: $user (profile=$profile)"
}

supprimer_utilisateur() {
    local user="$1"
    authentifier_unifi
    # Rechercher l'ID de l'utilisateur
    local user_id
    user_id=$(curl -sk -b "$COOKIE_JAR" \
        "https://${ROUTEUR_IP}:${ROUTEUR_PORT}/api/s/default/rest/user" | \
        python3 -c "import sys,json; data=json.load(sys.stdin); users=[u for u in data.get('data',[]) if u.get('name')=='$user']; print(users[0]['_id'] if users else '')" 2>/dev/null)
    if [ -n "$user_id" ]; then
        curl -sk -b "$COOKIE_JAR" -X DELETE \
            "https://${ROUTEUR_IP}:${ROUTEUR_PORT}/api/s/default/rest/user/${user_id}"
        log "SUPPRIME: $user"
    else
        log "ERREUR: utilisateur $user non trouve"
    fi
}

kick_session() {
    local mac="$1"
    authentifier_unifi
    curl -sk -b "$COOKIE_JAR" -X POST \
        "https://${ROUTEUR_IP}:${ROUTEUR_PORT}/api/s/default/cmd/stamgr" \
        -H "Content-Type: application/json" \
        -d "{\"cmd\":\"kick-sta\",\"mac\":\"$mac\"}"
    log "KICK: $mac"
}

envoyer_ack() {
    local action_id="$1"
    local ack_url="${ACK_BASE_URL}/${action_id}/done"
    curl -sk -X POST "$ack_url" \
        -H "Content-Type: application/json" \
        -H "X-Router-Token: $ROUTER_TOKEN" \
        -d '{"success":true}' > /dev/null 2>&1
    log "ACK: action #$action_id"
}

# ═══════════════════════════════════════════════════════
# BOUCLE PRINCIPALE
# ═══════════════════════════════════════════════════════
log "═══ Agent HotspotPay Ubiquiti demarre (hotspot=$HOTSPOT_ID) ═══"

while true; do
    actions=$(curl -sk -H "X-Router-Token: $ROUTER_TOKEN" "$POLLING_URL" 2>/dev/null)
    if [ -z "$actions" ]; then
        log "Polling: vide (timeout ou erreur)"
    else
        count=$(echo "$actions" | python3 -c "import sys,json; print(json.load(sys.stdin).get('count',0))" 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ] 2>/dev/null; then
            log "Polling: $count action(s)"
            echo "$actions" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for a in data.get('actions', []):
    t = a.get('type', '')
    u = a.get('username', '')
    p = a.get('password', '')
    pr = a.get('profile', 'default')
    m = a.get('macAddress', '')
    aid = a.get('actionId', '')
    if t == 'CREATE_USER' and u:
        print(f'CREATE|{u}|{p}|{pr}')
    elif t == 'REMOVE_USER' and u:
        print(f'REMOVE|{u}')
    elif t == 'KICK_SESSION' and m:
        print(f'KICK|{m}')
    print(f'ACK|{aid}')
" 2>/dev/null | while IFS='|' read -r action arg1 arg2 arg3; do
                case "$action" in
                    CREATE)   creer_utilisateur "$arg1" "$arg2" "$arg3" ;;
                    REMOVE)   supprimer_utilisateur "$arg1" ;;
                    KICK)     kick_session "$arg1" ;;
                    ACK)      envoyer_ack "$arg1" ;;
                esac
            done
        else
            log "Polling: aucune action en attente"
        fi
    fi
    sleep "$POLL_INTERVAL"
done
