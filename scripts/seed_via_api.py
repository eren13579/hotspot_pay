#!/usr/bin/env python3
"""
HotspotPay -- Seed de donnees de test via les APIs REST
======================================================
Version sans dependances (urllib uniquement).
Java proxy vers FastAPI => les donnees sont creees dans les 2 BDs.

Usage : python seed_via_api.py
"""

import json
import sys
import urllib.request
import urllib.error

BASE_JAVA = "http://localhost:8080/api/V1"
PASSWORD = "Made@2006"


# -- Helpers HTTP -------------------------------------------------
def api(method, url, body=None, headers=None, timeout=15):
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body_bytes = resp.read()
            status = resp.status
            try:
                data_json = json.loads(body_bytes) if body_bytes else {}
            except json.JSONDecodeError:
                data_json = {"raw": body_bytes.decode("utf-8", errors="replace")}
            return status, data_json
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(body)
        except json.JSONDecodeError:
            return e.code, {"error": body}
    except urllib.error.URLError as e:
        print("  [ERR] Connexion", url, ":", e.reason)
        return None, {"error": str(e.reason)}
    except Exception as e:
        print("  [ERR]", url, ":", e)
        return None, {"error": str(e)}


def ok(m):   print("  [OK]", m)
def warn(m): print("  [/]", m)
def fail(m): print("  [XX]", m)

def get_token(data):
    if "accessToken" in data:
        return data["accessToken"]
    if isinstance(data.get("data"), dict):
        return data["data"].get("accessToken")
    return None


# -- MAIN ---------------------------------------------------------
print("=" * 55)
print("  HOTSPOTPAY -- Seed Test Data via API")
print("=" * 55)

# Verifier connexion aux services
print("\n--- Verification des services ---")
for name, url in [("Java", f"{BASE_JAVA}/actuator/health")]:
    status, data = api("GET", url)
    if status == 200:
        ok(f"{name} repond")
    else:
        fail(f"{name} ne repond pas -- stop")
        sys.exit(1)

# --- LOGIN ADMIN -------------------------------------------------
print("\n--- Login admin ---")
status, data = api("POST", f"{BASE_JAVA}/auth/login",
                    {"email": "tedapatrick4@gmail.com", "password": PASSWORD})
if not status or status != 200:
    fail(f"Login admin echoue: {str(data)[:120]}")
    sys.exit(1)

ADMIN_JWT = get_token(data)
if not ADMIN_JWT:
    fail(f"Pas de token: {str(data)[:120]}")
    sys.exit(1)
ok("Token admin recu")

AUTH = {"Authorization": f"Bearer {ADMIN_JWT}"}

# --- CREER UTILISATEURS ------------------------------------------
print("\n--- Creation des utilisateurs ---")
test_users = [
    {"email": "admin@hotspotpay.com", "phone": "+237671234567", "password": PASSWORD},
    {"email": "reseller@hotspotpay.com", "phone": "+237698765432", "password": PASSWORD},
    {"email": "user@hotspotpay.com", "phone": "+237655443322", "password": PASSWORD},
    {"email": "customer@example.com", "phone": "+237612345678", "password": PASSWORD},
    {"email": "test@hotspotpay.com", "phone": "+237600000001", "password": PASSWORD},
]
for u in test_users:
    status, data = api("POST", f"{BASE_JAVA}/auth/register", u)
    if status in (200, 201):
        ok(f"{u['email']}")
    elif status == 409:
        warn(f"{u['email']} existe deja")
    else:
        detail = str(data.get("message", str(data)))[:60]
        warn(f"{u['email']} -> HTTP {status}: {detail}")

# --- CREER ABONNEMENT STANDARD POUR CHAQUE USER -----------------
print("\n--- Creation abonnements Standard ---")
all_users = ["tedapatrick4@gmail.com"] + [u["email"] for u in test_users]
for email in all_users:
    # Login as this user
    s, d = api("POST", f"{BASE_JAVA}/auth/login",
               {"email": email, "password": PASSWORD})
    if s != 200:
        warn(f"Impossible de login {email}")
        continue
    jwt = get_token(d)
    if not jwt:
        warn(f"Pas de token pour {email}")
        continue
    sub_auth = {"Authorization": f"Bearer {jwt}"}
    # Creer abonnement Standard
    ss, sd = api("POST", f"{BASE_JAVA}/subscriptions",
                 {"plan_name": "standard", "duration_months": 0, "currency": "XAF"},
                 sub_auth)
    if ss in (200, 201):
        ok(f"{email} -> abonnement Standard")
    elif ss == 409:
        warn(f"{email} -> abonnement existe deja")
    else:
        err = str(sd.get("message", str(sd)))[:60]
        warn(f"{email} -> HTTP {ss}: {err}")

# Rafraichir JWT (les nouveaux users changent le contexte)
print("\n--- Rafraichissement JWT ---")
status, data = api("POST", f"{BASE_JAVA}/auth/login",
                    {"email": "tedapatrick4@gmail.com", "password": PASSWORD})
if status == 200:
    ADMIN_JWT = get_token(data) or ADMIN_JWT
    AUTH = {"Authorization": f"Bearer {ADMIN_JWT}"}
    ok("Token a jour")

# --- CREER HOTSPOTS ----------------------------------------------
print("\n--- Creation des hotspots ---")
hotspots = [
    {"name": "Boutique Express Douala", "location": "Douala, Bonanjo",
     "mikrotikIp": "192.168.88.1", "mikrotikPort": 8728,
     "mikrotikUser": "admin", "mikrotikPassword": "router123",
     "routerBrand": "MikroTik", "routerType": "hAP AC2"},
    {"name": "Cafe Numerique Yaounde", "location": "Yaounde, Mvog-Mbi",
     "mikrotikIp": "10.0.0.1", "mikrotikPort": 8728,
     "mikrotikUser": "admin", "mikrotikPassword": "router456",
     "routerBrand": "MikroTik", "routerType": "RB951"},
    {"name": "Hub Cyber Bafoussam", "location": "Bafoussam, Centre Ville",
     "mikrotikIp": "172.16.0.1", "mikrotikPort": 8728,
     "mikrotikUser": "reseller", "mikrotikPassword": "hub789",
     "routerBrand": "MikroTik", "routerType": "RB750Gr3"},
]

created = {}
for hs in hotspots:
    status, data = api("POST", f"{BASE_JAVA}/hotspots", hs, AUTH)
    if status in (200, 201):
        inner = data.get("data", data)
        hid = inner.get("hotspot_id") or inner.get("id", "?")
        created[hs["name"]] = hid
        ok(f"{hs['name']} -> {hid}")
    elif status == 409:
        warn(f"{hs['name']} existe deja -- on cherche l'ID dans la liste")
    else:
        err = str(data.get("message", str(data)))[:80]
        warn(f"{hs['name']} -> HTTP {status}: {err}")

# Pour les hotspots deja existants, recuperer l'ID depuis le listing
if len(created) < len(hotspots):
    print("  -> Recuperation des IDs existants...")
    status, data = api("GET", f"{BASE_JAVA}/hotspots?scope=all&size=20", None, AUTH)
    if status == 200:
        inner = data.get("data", {})
        items = inner.get("content", [])
        for h in items:
            if isinstance(h, dict):
                hid = h.get("hotspot_id") or h.get("id", "")
                hname = h.get("name", "")
                if hid and hname and hname not in created:
                    created[hname] = hid
                    ok(f"{hname} -> {hid} (existant)")

# --- CREER FORFAITS (PLANS) --------------------------------------
PLANS = {
    "Boutique": [
        {"name": "1 Heure", "durationMinutes": 60, "price": 500,
         "downloadSpeedKbps": 1024, "uploadSpeedKbps": 512, "displayOrder": 1},
        {"name": "3 Heures", "durationMinutes": 180, "price": 1000,
         "downloadSpeedKbps": 1024, "uploadSpeedKbps": 512, "displayOrder": 2},
        {"name": "1 Jour", "durationMinutes": 1440, "price": 2000,
         "downloadSpeedKbps": 2048, "uploadSpeedKbps": 1024, "dataLimitMb": 500, "displayOrder": 3},
        {"name": "1 Semaine", "durationMinutes": 10080, "price": 5000,
         "downloadSpeedKbps": 4096, "uploadSpeedKbps": 2048, "dataLimitMb": 2000, "displayOrder": 4},
        {"name": "1 Mois", "durationMinutes": 43200, "price": 15000,
         "downloadSpeedKbps": 8192, "uploadSpeedKbps": 4096, "displayOrder": 5},
    ],
    "Cafe": [
        {"name": "1 Heure", "durationMinutes": 60, "price": 300,
         "downloadSpeedKbps": 512, "uploadSpeedKbps": 256, "displayOrder": 1},
        {"name": "3 Heures", "durationMinutes": 180, "price": 700,
         "downloadSpeedKbps": 1024, "uploadSpeedKbps": 512, "displayOrder": 2},
        {"name": "1 Jour", "durationMinutes": 1440, "price": 1500,
         "downloadSpeedKbps": 2048, "uploadSpeedKbps": 1024, "dataLimitMb": 300, "displayOrder": 3},
    ],
    "Hub": [
        {"name": "1 Heure", "durationMinutes": 60, "price": 400,
         "downloadSpeedKbps": 1024, "uploadSpeedKbps": 512, "displayOrder": 1},
        {"name": "1 Jour", "durationMinutes": 1440, "price": 1500,
         "downloadSpeedKbps": 2048, "uploadSpeedKbps": 1024, "dataLimitMb": 400, "displayOrder": 2},
        {"name": "1 Semaine", "durationMinutes": 10080, "price": 4000,
         "downloadSpeedKbps": 4096, "uploadSpeedKbps": 2048, "dataLimitMb": 1500, "displayOrder": 3},
        {"name": "1 Mois", "durationMinutes": 43200, "price": 12000,
         "downloadSpeedKbps": 8192, "uploadSpeedKbps": 4096, "displayOrder": 4},
    ],
}

def match_key(name):
    for k in PLANS:
        if k.lower() in name.lower():
            return k
    return "Boutique"

print("\n--- Creation des forfaits ---")
for hname, hid in created.items():
    key = match_key(hname)
    for plan in PLANS[key]:
        status, data = api("POST", f"{BASE_JAVA}/hotspots/{hid}/plans", plan, AUTH)
        if status in (200, 201):
            ok(f"{hname} -> {plan['name']}")
        elif status == 409:
            warn(f"{hname} -> {plan['name']} existe deja")
        else:
            err = str(data.get("message", str(data)))[:60]
            warn(f"{hname} -> {plan['name']} -> HTTP {status}: {err}")

# --- RESULTAT ----------------------------------------------------
print("\n" + "=" * 55)
print("  DONNEES DE TEST CREES AVEC SUCCES")
print("=" * 55)
print("")
print("Comptes de test (mdp: Made@2006) :")
print("  Admin    : tedapatrick4@gmail.com")
print("  Admin2   : admin@hotspotpay.com")
print("  Reseller : reseller@hotspotpay.com")
print("  User     : user@hotspotpay.com")
print("  Client   : customer@example.com")
print("  Test     : test@hotspotpay.com")
print("")
print("Hotspots crees :")
for hname, hid in created.items():
    print(f"  . {hid} -- {hname}")
print("")
print("URLs :")
print("  Swagger Java   : http://localhost:8080/api/V1/swagger-ui.html")
print("  Swagger FastAPI: http://localhost:8444/docs")
print("")
