#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
# HOTSPOTPAY — AGENT HUAWEI (AUTO-GENERE)
# ═══════════════════════════════════════════════════════
# Hotspot ......... __HOTSPOT_ID__
# Genere le ....... __GENERATED_AT__
# ═══════════════════════════════════════════════════════
# INSTALLATION :
#   1. Configurer les variables ROUTEUR ci-dessous
#   2. chmod +x hotspotpay-huawei-agent.sh
#   3. ./hotspotpay-huawei-agent.sh &
# ═══════════════════════════════════════════════════════

# ── CONFIGURATION AUTO-GENEREE ──
HOTSPOT_ID="__HOTSPOT_ID__"
ROUTER_TOKEN="__ROUTER_TOKEN__"
POLLING_URL="__POLLING_URL__"
ACK_BASE_URL="__ACK_BASE_URL__"
POLL_INTERVAL=15

# ── CONFIGURATION ROUTEUR ──
ROUTEUR_IP="192.168.8.1"
ROUTEUR_PORT=80

# ── FONCTIONS ──
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [HotspotPay] $1"; }

creer_utilisateur() {
    local user="$1" pass="$2" profile="${3:-default}"
    curl -sk -X POST "http://${ROUTEUR_IP}:${ROUTEUR_PORT}/api/user/hotspot/add" \
        -H "Content-Type: application/json" \
        -d "{\"Username\":\"$user\",\"Password\":\"$pass\",\"ProfileName\":\"$profile\"}"
    log "CREE: $user (profile=$profile)"
}

supprimer_utilisateur() {
    local user="$1"
    curl -sk -X POST "http://${ROUTEUR_IP}:${ROUTEUR_PORT}/api/user/hotspot/remove" \
        -H "Content-Type: application/json" \
        -d "{\"Username\":\"$user\"}"
    log "SUPPRIME: $user"
}

kick_session() {
    local mac="$1"
    curl -sk -X POST "http://${ROUTEUR_IP}:${ROUTEUR_PORT}/api/user/hotspot/disconnect" \
        -H "Content-Type: application/json" \
        -d "{\"MacAddress\":\"$mac\"}"
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
log "═══ Agent HotspotPay Huawei demarre (hotspot=$HOTSPOT_ID) ═══"

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
