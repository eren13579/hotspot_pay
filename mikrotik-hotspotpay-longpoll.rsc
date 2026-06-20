# ============================================================
# HotspotPay — Script MikroTik RouterOS Long Polling
# Version : 3.0 — Architecture Hybride (Pseudo-Push / Long Polling)
# Compatible : RouterOS 6.x et 7.x
#
# ARCHITECTURE :
#   Le routeur appelle FastAPI en Long Polling (~20s).
#   Si un ticket est payé, FastAPI répond immédiatement (<100ms).
#   Le routeur applique la commande en RAM (keep-result=no)
#   et envoie un ACK de confirmation.
#
# INSTALLATION :
#   1. Menu System -> Scripts -> Add
#      Name     : hotspotpay-longpoll
#      Source   : [coller ce script]
#
#   2. Menu System -> Scheduler -> Add
#      Name     : hotspotpay-scheduler
#      Start    : startup
#      Interval : 00:00:05 (5 secondes)
#      On Event : /system script run hotspotpay-longpoll
#
# CONFIGURATION : modifier les 3 variables ci-dessous uniquement
# ============================================================

# ── À CONFIGURER ─────────────────────────────────────────────
:local hotspotId   "VOTRE_HOTSPOT_ID"
:local routerToken "VOTRE_ROUTER_TOKEN"
:local serverUrl   "https://api.hotspotpay.cm:8443/api/V1"
# Profil HotSpot par défaut si le serveur n'en spécifie pas
:local defaultProfile "default"
# ─────────────────────────────────────────────────────────────

# ── Vérifications préalables ──────────────────────────────────
:if ([:len [/ip hotspot find]] = 0) do={
    :log warning "HotspotPay: Aucune interface HotSpot configuree"
    :error "no hotspot interface"
}

# ── Construction de l'URL de Long Polling ─────────────────────
:local pendingUrl ($serverUrl . "/router/" . $hotspotId . "/pending-actions?token=" . $routerToken)

# ── Étape 1 : Long Polling — appel GET avec durée max 25s ────
# FastAPI garde la connexion ouverte ~20s.
# Si action disponible → réponse immédiate avec JSON.
# Si timeout → réponse avec "count":0.
:local rawResponse ""

:do {
    /tool fetch \
        url=$pendingUrl \
        mode=https \
        http-method=get \
        http-header-field=("X-Router-Token: " . $routerToken) \
        output=user \
        duration=25s \
        keep-result=no \
        as-value do={
            :set rawResponse $"data"
        }
} on-error={
    :log debug "HotspotPay: Pas de connexion au serveur (normal si offline)"
    :error "connection failed"
}

# ── Étape 2 : Vérifier la réponse ─────────────────────────────
:if ([:len $rawResponse] < 10) do={
    :log debug "HotspotPay: Réponse vide — aucune action"
    :error "empty response"
}

# ── Étape 3 : Extraire le nombre d'actions ────────────────────
:local countPos [:find $rawResponse "\"count\":" 0]
:if ($countPos < 0) do={
    :log debug "HotspotPay: Format reponse inattendu"
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

:log info ("HotspotPay: " . $actionCount . " action(s) a traiter")

# ── Étape 4 : Parser et exécuter chaque action ────────────────
:local cursor 0

:for i from=0 to=($actionCount - 1) do={

    # ── Extraction actionId ──────────────────────────────────
    :local posId [:find $rawResponse "\"actionId\"" $cursor]
    :if ($posId < 0) do={ :error "no more actions" }
    :set cursor ($posId + 1)
    :local vs [:find $rawResponse "\"" ($posId + 11)]
    :local ve [:find $rawResponse "\"" ($vs + 1)]
    :local actionId [:pick $rawResponse ($vs + 1) $ve]

    # ── Extraction type ──────────────────────────────────────
    :local posType [:find $rawResponse "\"type\"" $posId]
    :local tsv [:find $rawResponse "\"" ($posType + 7)]
    :local tev [:find $rawResponse "\"" ($tsv + 1)]
    :local actionType [:pick $rawResponse ($tsv + 1) $tev]

    # ── Extraction username ──────────────────────────────────
    :local posUn [:find $rawResponse "\"username\"" $posId]
    :local unStart [:find $rawResponse "\"" ($posUn + 11)]
    :local unEnd   [:find $rawResponse "\"" ($unStart + 1)]
    :local username [:pick $rawResponse ($unStart + 1) $unEnd]

    :local success true
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

        # Extraire profile
        :local posProf [:find $rawResponse "\"profile\"" $posId]
        :local profile $defaultProfile
        :if ($posProf > 0) do={
            :local prS [:find $rawResponse "\"" ($posProf + 10)]
            :local prE [:find $rawResponse "\"" ($prS + 1)]
            :local profVal [:pick $rawResponse ($prS + 1) $prE]
            :if ([:len $profVal] > 0) do={ :set profile $profVal }
        }

        # Extraire timeLimit (format MikroTik: "4w2d" ou "24:00:00")
        :local posTl [:find $rawResponse "\"timeLimit\"" $posId]
        :local timeLimitStr ""
        :if ($posTl > 0) do={
            :local tlS [:find $rawResponse "\"" ($posTl + 12)]
            :local tlE [:find $rawResponse "\"" ($tlS + 1)]
            :set timeLimitStr [:pick $rawResponse ($tlS + 1) $tlE]
        }

        # Extraire dataLimit (octets)
        :local posDl [:find $rawResponse "\"dataLimit\"" $posId]
        :local dataLimitVal 0
        :if ($posDl > 0) do={
            :local dlS ([:find $rawResponse ":" ($posDl + 11)] + 1)
            :local dlE [:find $rawResponse "," $dlS]
            :if ($dlE < 0) do={ :set dlE [:find $rawResponse "}" $dlS] }
            :local dlRaw [:pick $rawResponse $dlS $dlE]
            :while ([:pick $dlRaw 0 1] = " ") do={
                :set dlRaw [:pick $dlRaw 1 [:len $dlRaw]]
            }
            :set dataLimitVal [:tonum $dlRaw]
        }

        # Extraire macAddress
        :local posMac [:find $rawResponse "\"macAddress\"" $posId]
        :local macStr ""
        :if ($posMac > 0) do={
            :local macS [:find $rawResponse "\"" ($posMac + 13)]
            :local macE [:find $rawResponse "\"" ($macS + 1)]
            :set macStr [:pick $rawResponse ($macS + 1) $macE]
        }

        # Extraire comment
        :local posComment [:find $rawResponse "\"comment\"" $posId]
        :local commentStr ""
        :if ($posComment > 0) do={
            :local cS [:find $rawResponse "\"" ($posComment + 10)]
            :local cE [:find $rawResponse "\"" ($cS + 1)]
            :set commentStr [:pick $rawResponse ($cS + 1) $cE]
        }

        # Supprimer l'user s'il existe déjà (idempotence)
        :local existing [/ip hotspot user find name=$username]
        :if ([:len $existing] > 0) do={
            /ip hotspot user remove $existing
            :log debug ("HotspotPay: User existant supprime avant recreation: " . $username)
        }

        # Construire les paramètres pour /ip hotspot user add
        :local addCmd ("/ip hotspot user add name=" . $username . " password=" . $password . " profile=" . $profile)

        # Ajouter limit-uptime si timeLimit présent
        :if ([:len $timeLimitStr] > 0) do={
            :set addCmd ($addCmd . " limit-uptime=" . $timeLimitStr)
        }

        # Ajouter limit-bytes-total si dataLimit présent
        :if ($dataLimitVal > 0) do={
            :set addCmd ($addCmd . " limit-bytes-total=" . $dataLimitVal)
        }

        # Ajouter mac-address si présent
        :if ([:len $macStr] > 0) do={
            :set addCmd ($addCmd . " mac-address=" . $macStr)
        }

        # Ajouter comment si présent
        :if ([:len $commentStr] > 0) do={
            :set addCmd ($addCmd . " comment=\"" . $commentStr . "\"")
        } else={
            :set addCmd ($addCmd . " comment=\"HP:" . $actionId . "\"")
        }

        # Créer l'utilisateur HotSpot
        :do {
            :execute $addCmd
            :log info ("HotspotPay: CREATE_USER OK user=" . $username . " profile=" . $profile . " timeLimit=" . $timeLimitStr . " dataLimit=" . $dataLimitVal)
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
                :log warning ("HotspotPay: REMOVE_USER - user deja absent: " . $username)
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
                :log warning ("HotspotPay: KICK_SESSION - session deja inactive: " . $username)
            }
        } on-error={
            :set success false
            :set errorMsg "kick_session_failed"
            :log error ("HotspotPay: KICK_SESSION FAILED user=" . $username)
        }
    }

    # ── Étape 5 : Envoyer l'ACK au serveur ────────────────────
    :local doneUrl ($serverUrl . "/router/" . $hotspotId . "/actions/" . $actionId . "/done?token=" . $routerToken)
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
            http-header-field="Content-Type: application/json" \
            http-data=$doneBody \
            output=none \
            keep-result=no \
            duration=5s
        :log info ("HotspotPay: ACK envoye actionId=" . $actionId . " success=" . $success)
    } on-error={
        :log error ("HotspotPay: ACK FAILED actionId=" . $actionId)
    }
}

:log info ("HotspotPay: Cycle termine — " . $actionCount . " action(s) traitee(s)")
