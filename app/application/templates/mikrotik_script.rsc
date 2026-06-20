# ═══════════════════════════════════════════════════════
# HOTSPOTPAY — SCRIPT MIKROTIK (AUTO-GENERE)
# ═══════════════════════════════════════════════════════
# Hotspot ......... {hotspot_id}
# Genere le ....... {generated_at}
# ═══════════════════════════════════════════════════════
# INSTALLATION :
#   1. Winbox -> System -> Scripts -> [+] -> Name: hotspotpay-poll
#   2. Coller ce script
#   3. System -> Scheduler -> [+] -> Interval: 15s, On-event: /system script run hotspotpay-poll
#   4. Log -> Filter: [HotspotPay]
# ═══════════════════════════════════════════════════════

# CONFIGURATION AUTO-GENEREE — ne pas modifier
:local hotspotId "{hotspot_id}"
:local routerToken "{router_token}"
:local pollingUrl "{polling_url}"

# ═══════════════════════════════════════════════════════
:log info "[HotspotPay] Polling $pollingUrl ..."

:local poll [/tool fetch url=$pollingUrl http-method=get http-header-field="X-Router-Token: $routerToken" output=user as-value]

:if ($poll->"status" = "finished") do={
    :local body ($poll->"data")
    :local blen [:len $body]

    :if ($blen > 10) do={
        # Extraire actionId
        :local apos [:find $body "actionId"]
        :local aid ""
        :if ($apos >= 0) do={
            :local aftera [:pick $body ($apos + 10) $blen]
            :local aq3 [:find $aftera "\"" 1]
            :local aq4 [:find $aftera "\"" ($aq3 + 1)]
            :set aid [:pick $aftera ($aq3 + 1) $aq4]
        }

        # Extraire type
        :local tpos [:find $body "type"]
        :local atype "CREATE_USER"
        :if ($tpos >= 0) do={
            :local aftert [:pick $body ($tpos + 6) $blen]
            :local tq3 [:find $aftert "\"" 1]
            :local tq4 [:find $aftert "\"" ($tq3 + 1)]
            :set atype [:pick $aftert ($tq3 + 1) $tq4]
        }

        :log info "[HotspotPay] Action: type=$atype aid=$aid"

        :if ($atype = "CREATE_USER") do={
            :local upos [:find $body "username"]
            :if ($upos >= 0) do={
                :local afteru [:pick $body ($upos + 10) $blen]
                :local uq3 [:find $afteru "\"" 1]
                :local uq4 [:find $afteru "\"" ($uq3 + 1)]
                :local uname [:pick $afteru ($uq3 + 1) $uq4]

                :local ppos [:find $body "password"]
                :local upass ""
                :if ($ppos >= 0) do={
                    :local afterp [:pick $body ($ppos + 10) $blen]
                    :local pq3 [:find $afterp "\"" 1]
                    :local pq4 [:find $afterp "\"" ($pq3 + 1)]
                    :set upass [:pick $afterp ($pq3 + 1) $pq4]
                }

                /ip hotspot user add name=$uname password=$upass profile=default
                :log info "[HotspotPay] CREE: $uname"
            }
        }

        :if ($atype = "REMOVE_USER") do={
            :local upos [:find $body "username"]
            :if ($upos >= 0) do={
                :local afteru [:pick $body ($upos + 10) $blen]
                :local uq3 [:find $afteru "\"" 1]
                :local uq4 [:find $afteru "\"" ($uq3 + 1)]
                :local uname [:pick $afteru ($uq3 + 1) $uq4]

                /ip hotspot user remove [find name=$uname]
                :log info "[HotspotPay] SUPPRIME: $uname"
            }
        }

        :if ($atype = "KICK_SESSION") do={
            :local mpos [:find $body "macAddress"]
            :if ($mpos >= 0) do={
                :local afterm [:pick $body ($mpos + 12) $blen]
                :local mq3 [:find $afterm "\"" 1]
                :local mq4 [:find $afterm "\"" ($mq3 + 1)]
                :local mac [:pick $afterm ($mq3 + 1) $mq4]

                /ip hotspot active remove [find mac-address=$mac]
                :log info "[HotspotPay] KICK: $mac"
            }
        }

        # ACK
        :if ([:len $aid] > 0) do={
            :local aurl "{ack_base_url}/$aid/done"
            /tool fetch url=$aurl http-method=post http-header-field="Content-Type: application/json,X-Router-Token: $routerToken" http-data="{\"success\":true}" output=none
            :log info "[HotspotPay] ACK envoye pour $aid"
        }
    }
} else={
    :log warning "[HotspotPay] Fetch echoue: ($poll->"status")"
}
