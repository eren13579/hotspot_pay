# ============================================================
# HotspotPay — Script MikroTik RouterOS Pull Architecture
# Version : 2.0
# Compatible : RouterOS 6.x et 7.x
#
# INSTALLATION :
#   1. Menu System → Scripts → Add
#      Name     : hotspotpay-pull
#      Source   : [coller ce script]
#
#   2. Menu System → Scheduler → Add
#      Name     : hotspotpay-scheduler
#      Start    : startup
#      Interval : 00:00:10 (10 secondes)
#      On Event : /system script run hotspotpay-pull
#
# CONFIGURATION : modifier les 4 variables ci-dessous uniquement
# ============================================================

# ── À CONFIGURER ─────────────────────────────────────────────
:local hotspotId   "VOTRE_HOTSPOT_ID"
:local routerToken "VOTRE_ROUTER_TOKEN"
:local serverUrl   "https://api.hotspotpay.cm/api/V1"
# Profil HotSpot par défaut si le serveur n'en spécifie pas
:local defaultProfile "default"
# ─────────────────────────────────────────────────────────────

# ── Vérifications préalables ──────────────────────────────────
# S'assurer qu'une interface HotSpot existe avant de continuer
:if ([:len [/ip hotspot find]] = 0) do={
    :log warning "HotspotPay: Aucune interface HotSpot configurée"
    :error "no hotspot interface"
}

# ── Construction des URLs ─────────────────────────────────────
:local pendingUrl ($serverUrl . "/router/" . $hotspotId . "/pending-actions?token=" . $routerToken)
:local doneBase   ($serverUrl . "/router/" . $hotspotId . "/actions/")

# ── Étape 1 : Polling — récupérer les actions PENDING ─────────
:local rawResponse ""

:do {
    /tool fetch \
        url=$pendingUrl \
        mode=https \
        http-method=get \
        http-header-field="X-Router-Token: $routerToken" \
        output=user \
        duration=8s \
        as-value do={
            :set rawResponse $"data"
        }
} on-error={
    :log debug "HotspotPay: Pas de connexion au serveur (normal si offline)"
    :error "connection failed"
}

# Vérifier qu'on a reçu quelque chose
:if ([:len $rawResponse] < 10) do={
    :log debug "HotspotPay: Réponse vide"
    :error "empty response"
}

# ── Étape 2 : Vérifier s'il y a des actions ───────────────────
# Chercher "\"count\":" dans la réponse
:local countPos [:find $rawResponse "\"count\":" 0]
:if ($countPos < 0) do={
    :log debug "HotspotPay: Format réponse inattendu"
    :error "bad format"
}

:local countStart ($countPos + 8)
:local countEnd   [:find $rawResponse "," $countStart]
:if ($countEnd < 0) do={ :set countEnd [:find $rawResponse "}" $countStart] }
:local actionCount [:tonum [:pick $rawResponse $countStart $countEnd]]

:if ($actionCount = 0) do={
    :log debug "HotspotPay: 0 action pending"
    :error "no actions"
}

:log info ("HotspotPay: " . $actionCount . " action(s) à traiter")

# ── Étape 3 : Parser et exécuter chaque action ────────────────
# On itère en cherchant chaque occurrence de "actionId"
:local cursor 0

:for i from=0 to=($actionCount - 1) do={

    # ── Extraction actionId ──────────────────────────────────
    :local posId    [:find $rawResponse "\"actionId\"" $cursor]
    :if ($posId < 0) do={ :error "no more actions" }
    :set cursor ($posId + 1)
    :local vs [:find $rawResponse "\"" ($posId + 11)]
    :local ve [:find $rawResponse "\"" ($vs + 1)]
    :local actionId [:pick $rawResponse ($vs + 1) $ve]

    # ── Extraction type ──────────────────────────────────────
    :local posType  [:find $rawResponse "\"type\"" $posId]
    :local tsv [:find $rawResponse "\"" ($posType + 7)]
    :local tev [:find $rawResponse "\"" ($tsv + 1)]
    :local actionType [:pick $rawResponse ($tsv + 1) $tev]

    # ── Extraction username ──────────────────────────────────
    :local posUn  [:find $rawResponse "\"username\"" $posId]
    :local unStart [:find $rawResponse "\"" ($posUn + 11)]
    :local unEnd   [:find $rawResponse "\"" ($unStart + 1)]
    :local username [:pick $rawResponse ($unStart + 1) $unEnd]

    :local success  true
    :local errorMsg ""

    :log info ("HotspotPay: [" . ($i+1) . "/" . $actionCount . "] " . $actionType . " user=" . $username)

    # ════════════════════════════════════════════════════════
    # ACTION : CREATE_USER
    # ════════════════════════════════════════════════════════
    :if ($actionType = "CREATE_USER") do={

        # Extraire password
        :local posPw [:find $rawResponse "\"password\"" $posId]
        :local pwS [:find $rawResponse "\"" ($posPw + 11)]
        :local pwE [:find $rawResponse "\"" ($pwS + 1)]
        :local password [:pick $rawResponse ($pwS + 1) $pwE]

        # Extraire macAddress
        :local posMac [:find $rawResponse "\"macAddress\"" $posId]
        :local macStr ""
        :if ($posMac > 0) do={
            :local macS [:find $rawResponse "\"" ($posMac + 13)]
            :local macE [:find $rawResponse "\"" ($macS + 1)]
            :set macStr [:pick $rawResponse ($macS + 1) $macE]
        }

        # Extraire durationMinutes
        :local posDur [:find $rawResponse "\"durationMinutes\"" $posId]
        :local durationMinutes 60
        :if ($posDur > 0) do={
            :local durS ([:find $rawResponse ":" ($posDur + 17)] + 1)
            :local durE [:find $rawResponse "," $durS]
            :if ($durE < 0) do={ :set durE [:find $rawResponse "}" $durS] }
            :local durRaw [:pick $rawResponse $durS $durE]
            # Supprimer espaces
            :while ([:pick $durRaw 0 1] = " ") do={
                :set durRaw [:pick $durRaw 1 [:len $durRaw]]
            }
            :set durationMinutes [:tonum $durRaw]
        }

        # Extraire profile
        :local posProf [:find $rawResponse "\"profile\"" $posId]
        :local profile $defaultProfile
        :if ($posProf > 0) do={
            :local prS [:find $rawResponse "\"" ($posProf + 10)]
            :local prE [:find $rawResponse "\"" ($prS + 1)]
            :local profVal [:pick $rawResponse ($prS + 1) $prE]
            :if ([:len $profVal] > 0) do={ :set profile $profVal }
        }

        # Calculer limit-uptime (HH:MM:SS)
        :local hours   ($durationMinutes / 60)
        :local minutes ($durationMinutes % 60)
        :local uptime  ($hours . ":" . $minutes . ":00")

        # Supprimer l'user s'il existe déjà (idempotence)
        :local existing [/ip hotspot user find name=$username]
        :if ([:len $existing] > 0) do={
            /ip hotspot user remove $existing
            :log debug ("HotspotPay: User existant supprimé avant recréation: " . $username)
        }

        # Créer l'utilisateur HotSpot
        :do {
            :if ([:len $macStr] > 0) do={
                /ip hotspot user add \
                    name=$username \
                    password=$password \
                    mac-address=$macStr \
                    limit-uptime=$uptime \
                    profile=$profile \
                    comment=("HP:" . $actionId)
            } else={
                /ip hotspot user add \
                    name=$username \
                    password=$password \
                    limit-uptime=$uptime \
                    profile=$profile \
                    comment=("HP:" . $actionId)
            }
            :log info ("HotspotPay: CREATE_USER OK user=" . $username . \
                       " mac=" . $macStr . " uptime=" . $uptime . " profile=" . $profile)
        } on-error={
            :set success false
            :set errorMsg "create_user_failed"
            :log error ("HotspotPay: CREATE_USER FAILED user=" . $username)
        }
    }

    # ════════════════════════════════════════════════════════
    # ACTION : REMOVE_USER
    # ════════════════════════════════════════════════════════
    :if ($actionType = "REMOVE_USER") do={
        :do {
            :local userEntry [/ip hotspot user find name=$username]
            :if ([:len $userEntry] > 0) do={
                /ip hotspot user remove $userEntry
                :log info ("HotspotPay: REMOVE_USER OK user=" . $username)
            } else={
                :log warning ("HotspotPay: REMOVE_USER - user déjà absent: " . $username)
                # Pas d'erreur — idempotent
            }
        } on-error={
            :set success false
            :set errorMsg "remove_user_failed"
            :log error ("HotspotPay: REMOVE_USER FAILED user=" . $username)
        }
    }

    # ════════════════════════════════════════════════════════
    # ACTION : KICK_SESSION
    # ════════════════════════════════════════════════════════
    :if ($actionType = "KICK_SESSION") do={
        :do {
            :local activeEntry [/ip hotspot active find user=$username]
            :if ([:len $activeEntry] > 0) do={
                /ip hotspot active remove $activeEntry
                :log info ("HotspotPay: KICK_SESSION OK user=" . $username)
            } else={
                :log warning ("HotspotPay: KICK_SESSION - session déjà inactive: " . $username)
                # Pas d'erreur — idempotent
            }
        } on-error={
            :set success false
            :set errorMsg "kick_session_failed"
            :log error ("HotspotPay: KICK_SESSION FAILED user=" . $username)
        }
    }

    # ── Étape 4 : Confirmer l'action au serveur ───────────────
    :local doneUrl ($doneBase . $actionId . "/done?token=" . $routerToken)
    :local doneBody ""

    :if ($success) do={
        :set doneBody "{\"success\":true,\"error\":\"\"}"
    } else={
        :set doneBody ("{\"success\":false,\"error\":\"" . $errorMsg . "\"}")
    }

    :do {
        /tool fetch \
            url=$doneUrl \
            mode=https \
            http-method=post \
            http-header-field="Content-Type: application/json\r\nX-Router-Token: $routerToken" \
            http-data=$doneBody \
            output=none \
            duration=5s
        :log info ("HotspotPay: Confirmation OK actionId=" . $actionId . \
                   " success=" . $success)
    } on-error={
        :log error ("HotspotPay: Confirmation FAILED actionId=" . $actionId . \
                    " (sera retentée par le serveur)")
    }

}

:log info ("HotspotPay: Cycle terminé — " . $actionCount . " action(s) traitée(s)")
