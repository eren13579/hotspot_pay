#!/usr/bin/env python3
"""
HotspotPay — Générateur de données de test
===========================================
Génère un script SQL avec des fausses données réalistes pour les deux bases :
  - hotspot_pay (Java)
  - hotspot_fastapi (FastAPI)

Usage :
  python generate_test_data.py > seed-test-data.sql
  docker exec -i hotspotpay-postgres psql -U postgres < seed-test-data.sql
"""

import uuid
import datetime
import random
import hashlib
import base64
import os

# ── Configuration ───────────────────────────────────────────
BCRYPT_HASH = os.environ.get("BCRYPT_HASH", "$2b$10$ZHPwOFIJEqK7JmB8SjOz7uVpX0kOXO5h8OzFyHgRxDLvlPJRWqNf6")
""" Hash BCrypt du mot de passe commun (par défaut: hash d'un mdp connu).
    Les comptes de test utilisent tous le même mot de passe.
    Pour générer un vrai hash : pip install bcrypt && python -c "import bcrypt; print(bcrypt.hashpw(b'test123', bcrypt.gensalt(rounds=10)).decode())"
"""

PASSWORD_PLAIN = "test123"
SEED_USER_PHONE_PREFIX = "2376"  # Cameroon

NOW = datetime.datetime.now(datetime.timezone.utc)


# ── Helpers ─────────────────────────────────────────────────
def uid(prefix: str) -> str:
    """Génère un ID lisible du type 'usr_a1b2c3d4'"""
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def ts(days_offset: int = 0, hours_offset: int = 0) -> str:
    """Génère un timestamp PostgreSQL fmté"""
    dt = NOW + datetime.timedelta(days=days_offset, hours=hours_offset)
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def ts_future(days: int = 1, hours: int = 0) -> str:
    return ts(days_offset=days, hours_offset=hours)


def ts_past(days: int = 1, hours: int = 0) -> str:
    return ts(days_offset=-days, hours_offset=-hours)


def money(amount: int) -> str:
    """Formate un montant pour le type DECIMAL """
    return f"{amount:.2f}"


def sql_str(val) -> str:
    """Échappe une valeur pour SQL (NULL si None)"""
    if val is None:
        return "NULL"
    return f"'{str(val).replace(chr(39), chr(39)+chr(39))}'"  # simple quote escaping


def sql_list(vals: list) -> str:
    """Formatte une liste de valeurs pour INSERT multi-lignes"""
    return ",\n".join(f"  ({', '.join(str(v) for v in row)})" for row in vals)


# ── Génération des données ─────────────────────────────────

def generate_hotspot_pay():
    """Génère les INSERT pour la base hotspot_pay (Java)"""
    lines = []
    lines.append("-- =======================================================")
    lines.append("-- HOTSPOTPAY — Données de test pour la base hotspot_pay")
    lines.append(f"-- Généré le : {NOW.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    lines.append(f"-- Mot de passe commun : {PASSWORD_PLAIN}")
    lines.append("-- =======================================================")
    lines.append("")
    lines.append("\\c hotspot_pay")
    lines.append("")
    lines.append("BEGIN;")
    lines.append("")

    # ── USERS ────────────────────────────────────────────────
    users = [
        {
            "user_id": "usr_admin_001",
            "email": "admin@hotspotpay.com",
            "phone": "237671234567",
            "full_name": "Jean-Paul Mbarga",
            "country": "CM",
            "plan_type": "PREMIUM",
            "role": "ADMIN",
        },
        {
            "user_id": "usr_reseller_001",
            "email": "reseller@hotspotpay.com",
            "phone": "237698765432",
            "full_name": "Marie-Claire Nkolo",
            "country": "CM",
            "plan_type": "PRO",
            "role": "RESELLER",
        },
        {
            "user_id": "usr_standard_001",
            "email": "user@hotspotpay.com",
            "phone": "237655443322",
            "full_name": "Pierre Essomba",
            "country": "CM",
            "plan_type": "STANDARD",
            "role": "USER",
        },
        {
            "user_id": "usr_standard_002",
            "email": "customer@example.com",
            "phone": "237612345678",
            "full_name": "Alice Bello",
            "country": "CM",
            "plan_type": "STANDARD",
            "role": "USER",
        },
        {
            "user_id": "usr_test_001",
            "email": "test@hotspotpay.com",
            "phone": "237600000001",
            "full_name": "Test Account",
            "country": "CM",
            "plan_type": "STANDARD",
            "role": "USER",
        },
    ]

    users_sql = []
    for u in users:
        users_sql.append(
            f"({sql_str(u['user_id'])}, {sql_str(u['email'])}, {sql_str(u['phone'])}, "
            f"{sql_str(BCRYPT_HASH)}, {sql_str(u['full_name'])}, {sql_str(u['country'])}, "
            f"{sql_str(u['plan_type'])}, {sql_str(u['role'])}, TRUE, "
            f"{sql_str(ts_past(30))}, {sql_str(ts_past(0))})"
        )

    lines.append("-- ── USERS ────────────────────────────────")
    lines.append("INSERT INTO users (user_id, email, phone, password, full_name, country, plan_type, role, is_active, created_at, updated_at)")
    lines.append("VALUES")
    lines.append(",\n".join(users_sql) + ";")
    lines.append("")

    # ── SUBSCRIPTIONS (rattachées aux users) ─────────────────
    subs = [
        ("sub_admin_001", "usr_admin_001", "PREMIUM", "50000.00", "XAF", 12, "ACTIVE", ts_past(60), ts_future(300)),
        ("sub_reseller_001", "usr_reseller_001", "PRO", "15000.00", "XAF", 1, "ACTIVE", ts_past(15), ts_future(15)),
        ("sub_standard_001", "usr_standard_001", "STANDARD", "0.00", "XAF", 12, "ACTIVE", ts_past(90), ts_future(275)),
        ("sub_expired_001", "usr_standard_002", "STANDARD", "0.00", "XAF", 1, "EXPIRED", ts_past(60), ts_past(30)),
    ]

    lines.append("-- ── SUBSCRIPTIONS ────────────────────────")
    for sub in subs:
        lines.append(
            f"INSERT INTO subscriptions (subscription_id, user_id, plan_name, amount, currency, "
            f"duration_months, status, starts_at, expires_at, created_at, updated_at) "
            f"VALUES ({sql_str(sub[0])}, {sql_str(sub[1])}, {sql_str(sub[2])}, "
            f"'{sub[3]}', {sql_str(sub[4])}, {sub[5]}, {sql_str(sub[6])}, "
            f"{sql_str(sub[7])}, {sql_str(sub[8])}, {sql_str(ts_past(60))}, {sql_str(ts_past(0))});"
        )
    lines.append("")

    # ── HOTSPOTS ─────────────────────────────────────────────
    hotspots = [
        {
            "hotspot_id": "hot_boutique_001",
            "user_id": "usr_admin_001",
            "name": "Boutique Express Douala",
            "location": "Douala, Bonanjo, Rue Principale",
            "mikrotik_ip": "192.168.88.1",
            "mikrotik_port": 8728,
            "mikrotik_user": "admin",
            "mikrotik_password_enc": "ENC_DEV_PASSWORD_BOUTIQUE",
            "router_brand": "MikroTik",
            "router_type": "hAP AC2",
            "is_online": True,
            "router_token": "tok_boutique_dla_abc123",
            "last_ping_at": ts(hours_offset=-1),
        },
        {
            "hotspot_id": "hot_cafe_001",
            "user_id": "usr_admin_001",
            "name": "Café Numérique Yaoundé",
            "location": "Yaoundé, Mvog-Mbi, Avenue Kennedy",
            "mikrotik_ip": "10.0.0.1",
            "mikrotik_port": 8728,
            "mikrotik_user": "admin",
            "mikrotik_password_enc": "ENC_DEV_PASSWORD_CAFE",
            "router_brand": "MikroTik",
            "router_type": "RB951",
            "is_online": False,
            "router_token": None,
            "last_ping_at": ts_past(2),
        },
        {
            "hotspot_id": "hot_reseller_001",
            "user_id": "usr_reseller_001",
            "name": "Hub Cyber Bafoussam",
            "location": "Bafoussam, Centre Ville",
            "mikrotik_ip": "172.16.0.1",
            "mikrotik_port": 8728,
            "mikrotik_user": "reseller_admin",
            "mikrotik_password_enc": "ENC_DEV_PASSWORD_HUB",
            "router_brand": "MikroTik",
            "router_type": "RB750Gr3",
            "is_online": True,
            "router_token": "tok_hub_baf_xyz789",
            "last_ping_at": ts(hours_offset=-3),
        },
        {
            "hotspot_id": "hot_standard_001",
            "user_id": "usr_standard_001",
            "name": "WiFi Maison Essomba",
            "location": "Douala, Bonaberi",
            "mikrotik_ip": "192.168.1.1",
            "mikrotik_port": 8728,
            "mikrotik_user": "pi user",
            "mikrotik_password_enc": "ENC_DEV_PASSWORD_MAISON",
            "router_brand": "TP-Link",
            "router_type": "TL-WR940N",
            "is_online": False,
            "router_token": None,
            "last_ping_at": None,
        },
    ]

    lines.append("-- ── HOTSPOTS ──────────────────────────────")
    for h in hotspots:
        lines.append(
            f"INSERT INTO hotspots (hotspot_id, user_id, name, location, mikrotik_ip, mikrotik_port, "
            f"mikrotik_user, mikrotik_password_enc, router_brand, router_type, is_online, "
            f"router_token, last_ping_at, created_at, updated_at) "
            f"VALUES ({sql_str(h['hotspot_id'])}, {sql_str(h['user_id'])}, "
            f"{sql_str(h['name'])}, {sql_str(h['location'])}, {sql_str(h['mikrotik_ip'])}, "
            f"{h['mikrotik_port']}, {sql_str(h['mikrotik_user'])}, "
            f"{sql_str(h['mikrotik_password_enc'])}, {sql_str(h['router_brand'])}, "
            f"{sql_str(h['router_type'])}, {'TRUE' if h['is_online'] else 'FALSE'}, "
            f"{sql_str(h['router_token'])}, {sql_str(h['last_ping_at'])}, "
            f"{sql_str(ts_past(30))}, {sql_str(ts_past(0))});"
        )
    lines.append("")

    # ── PLANS ────────────────────────────────────────────────
    plans_data = [
        # (plan_id, hotspot_id, name, duration_min, price, currency, dl, ul, data_limit, display_order, hotspot_profile)
        # Hotspot Admin 1 — Boutique Douala
        ("pln_bout_1h",   "hot_boutique_001", "1 Heure",       60,   500,   "XAF", 1024, 512, None,  1, "default"),
        ("pln_bout_3h",   "hot_boutique_001", "3 Heures",      180,  1000,  "XAF", 1024, 512, None,  2, "default"),
        ("pln_bout_1j",   "hot_boutique_001", "1 Jour",        1440, 2000,  "XAF", 2048, 1024, 500,  3, "default"),
        ("pln_bout_1sem", "hot_boutique_001", "1 Semaine",     10080,5000,  "XAF", 4096, 2048, 2000, 4, "default"),
        ("pln_bout_1mois","hot_boutique_001", "1 Mois",        43200,15000, "XAF", 8192, 4096, None,  5, "default"),
        # Hotspot Admin 2 — Café Yaoundé
        ("pln_cafe_1h",   "hot_cafe_001",    "1 Heure",       60,   300,   "XAF", 512,  256,  None,  1, "default"),
        ("pln_cafe_3h",   "hot_cafe_001",    "3 Heures",      180,  700,   "XAF", 1024, 512,  None,  2, "default"),
        ("pln_cafe_1j",   "hot_cafe_001",    "1 Jour",        1440, 1500,  "XAF", 2048, 1024, 300,   3, "default"),
        # Hotspot Reseller — Bafoussam
        ("pln_hub_1h",    "hot_reseller_001","1 Heure",       60,   400,   "XAF", 1024, 512,  None,  1, "default"),
        ("pln_hub_1j",    "hot_reseller_001","1 Jour",        1440, 1500,  "XAF", 2048, 1024, 400,   2, "default"),
        ("pln_hub_1sem",  "hot_reseller_001","1 Semaine",     10080,4000,  "XAF", 4096, 2048, 1500,  3, "default"),
        ("pln_hub_1mois", "hot_reseller_001","1 Mois",        43200,12000, "XAF", 8192, 4096, None,  4, "default"),
        # Hotspot Standard — Maison Essomba
        ("pln_maison_1j", "hot_standard_001","1 Jour",        1440, 1000,  "XAF", 1024, 512,  200,   1, "default"),
        ("pln_maison_1sem","hot_standard_001","1 Semaine",    10080,3500,  "XAF", 2048, 1024, 1000,  2, "default"),
    ]

    lines.append("-- ── PLANS ─────────────────────────────────")
    for p in plans_data:
        lines.append(
            f"INSERT INTO plans (plan_id, hotspot_id, name, duration_minutes, price, currency, "
            f"download_speed_kbps, upload_speed_kbps, data_limit_mb, display_order, hotspot_profile, "
            f"is_active, created_at, updated_at) "
            f"VALUES ({sql_str(p[0])}, {sql_str(p[1])}, {sql_str(p[2])}, {p[3]}, {money(p[4])}, "
            f"{sql_str(p[5])}, {p[6]}, {p[7]}, {sql_str(p[8])}, {p[9]}, "
            f"{sql_str(p[10])}, TRUE, {sql_str(ts_past(30))}, {sql_str(ts_past(0))});"
        )
    lines.append("")

    # ── TICKETS ──────────────────────────────────────────────
    tickets = [
        # (ticket_id, hotspot_id, user_id, username, password, profile, comment, status, uptime_limit, data_limit)
        ("tkt_001", "hot_boutique_001", "usr_admin_001", "voucher_bout_001", "vouch123", "default", "Voucher 1h", "AVAILABLE", None, None),
        ("tkt_002", "hot_boutique_001", "usr_admin_001", "voucher_bout_002", "vouch456", "default", "Voucher 3h", "AVAILABLE", None, None),
        ("tkt_003", "hot_boutique_001", "usr_admin_001", "voucher_bout_003", "vouch789", "default", "Voucher 1j", "USED", None, None),
        ("tkt_004", "hot_reseller_001", "usr_reseller_001", "hub_v_001", "hubpass01", "default", "Ticket réunion", "AVAILABLE", None, None),
        ("tkt_005", "hot_reseller_001", "usr_reseller_001", "hub_v_002", "hubpass02", "default", "Ticket semaine", "AVAILABLE", None, None),
        ("tkt_006", "hot_reseller_001", "usr_reseller_001", "hub_v_003", "hubpass03", "default", "Expired voucher", "EXPIRED", None, None),
    ]

    lines.append("-- ── TICKETS ───────────────────────────────")
    for t in tickets:
        lines.append(
            f"INSERT INTO tickets (ticket_id, hotspot_id, user_id, username, password, profile, comment, status, "
            f"uptime_limit, data_limit, expires_at, created_at, updated_at) "
            f"VALUES ({sql_str(t[0])}, {sql_str(t[1])}, {sql_str(t[2])}, {sql_str(t[3])}, "
            f"{sql_str(t[4])}, {sql_str(t[5])}, {sql_str(t[6])}, {sql_str(t[7])}, "
            f"{sql_str(t[8])}, {sql_str(t[9])}, "
            f"{sql_str(ts_future(30) if t[7] == 'AVAILABLE' else ts_past(5))}, "
            f"{sql_str(ts_past(7))}, {sql_str(ts_past(0))});"
        )
    lines.append("")

    # ── PAYMENTS ─────────────────────────────────────────────
    payments = [
        # (payment_id, reference, hotspot_id, plan_id, client_phone, client_mac, operator, amount, currency, status, gateway_tx_id, paid_at, description)
        ("pay_mtn_001", "REF-MTN-001", "hot_boutique_001", "pln_bout_1h", "237671234567", "AA:BB:CC:DD:EE:01", "MTN_MOMO", 500, "XAF", "PAID", "MTN-TX-1001", ts_past(0), "Paiement boutique 1h"),
        ("pay_mtn_002", "REF-MTN-002", "hot_boutique_001", "pln_bout_1j", "237698765432", "AA:BB:CC:DD:EE:02", "MTN_MOMO", 2000, "XAF", "PAID", "MTN-TX-1002", ts_past(0), "Paiement boutique 1j"),
        ("pay_om_001",  "REF-OM-001",  "hot_cafe_001", "pln_cafe_1h", "237655443322", "AA:BB:CC:DD:EE:03", "ORANGE_MONEY", 300, "XAF", "PAID", "OM-TX-2001", ts_past(1), "Paiement café 1h"),
        ("pay_om_002",  "REF-OM-002",  "hot_reseller_001", "pln_hub_1j", "237612345678", "AA:BB:CC:DD:EE:04", "ORANGE_MONEY", 1500, "XAF", "PAID", "OM-TX-2002", ts_past(2), "Paiement hub 1j"),
        ("pay_mtn_003", "REF-MTN-003", "hot_boutique_001", "pln_bout_1h", "237670011223", "AA:BB:CC:DD:EE:05", "MTN_MOMO", 500, "XAF", "PAID", "MTN-TX-1003", ts_past(3), "Client régulier Momo"),
        ("pay_mon_001", "REF-MON-001", "hot_boutique_001", "pln_bout_1sem", "237671234567", "00:00:00:00:00:00", "MONEROO", 5000, "XAF", "PAID", "MON-TX-3001", ts_future(-1), "Paiement via Moneroo"),
        ("pay_cam_001", "REF-CAM-001", "hot_reseller_001", "pln_hub_1h", "237691112233", "00:00:00:00:00:01", "CAMPAY", 400, "XAF", "PAID", "CAM-TX-4001", ts_past(1), "Test CamPay"),
        ("pay_pending_001", "REF-PEND-001", "hot_boutique_001", "pln_bout_3h", "237650000001", "00:00:00:00:00:02", "MTN_MOMO", 1000, "XAF", "PENDING", None, None, "Paiement en attente Momo"),
        ("pay_pending_002", "REF-PEND-002", "hot_reseller_001", "pln_hub_1sem", "237650000002", "00:00:00:00:00:03", "ORANGE_MONEY", 4000, "XAF", "PENDING", None, None, "Paiement en attente OM"),
        ("pay_failed_001", "REF-FAIL-001", "hot_cafe_001", "pln_cafe_3h", "237650000003", "AA:BB:CC:DD:EE:FF", "MTN_MOMO", 700, "XAF", "FAILED", "MTN-TX-ERR", None, "Échec : solde insuffisant"),
        ("pay_failed_002", "REF-FAIL-002", "hot_boutique_001", "pln_bout_1h", "237650000004", "00:00:00:00:00:04", "ORANGE_MONEY", 500, "XAF", "FAILED", None, None, "Échec : timeout API"),
        ("pay_expired_001", "REF-EXP-001", "hot_boutique_001", "pln_bout_1mois", "237650000005", "00:00:00:00:00:05", "MTN_MOMO", 15000, "XAF", "EXPIRED", None, None, "Expiré : non payé sous 30 min"),
    ]

    lines.append("-- ── PAYMENTS ──────────────────────────────")
    for p in payments:
        lines.append(
            f"INSERT INTO payments (payment_id, reference, hotspot_id, plan_id, client_phone, "
            f"client_mac, operator, amount, currency, status, gateway_tx_id, "
            f"paid_at, description, expires_at, created_at, updated_at) "
            f"VALUES ({sql_str(p[0])}, {sql_str(p[1])}, {sql_str(p[2])}, {sql_str(p[3])}, "
            f"{sql_str(p[4])}, {sql_str(p[5])}, {sql_str(p[6])}, "
            f"{money(p[7])}, {sql_str(p[8])}, {sql_str(p[9])}, "
            f"{sql_str(p[10])}, {sql_str(p[11])}, "
            f"{sql_str(p[12])}, "
            f"{sql_str(ts_future(1) if p[9] not in ('FAILED','EXPIRED') else ts_past(0))}, "
            f"{sql_str(ts_past(7))}, {sql_str(ts_past(0))});"
        )
    lines.append("")

    # ── SESSIONS ─────────────────────────────────────────────
    sessions = [
        # (session_id, payment_id, hotspot_id, plan_id, client_phone, client_mac,
        #  mikrotik_username, mikrotik_password, status, activated_at, expires_at, bytes_in, bytes_out)
        ("ses_active_001", "pay_mtn_001", "hot_boutique_001", "pln_bout_1h", "237671234567", "AA:BB:CC:DD:EE:01",
         "mtn_671234567", "srv_mtn_001", "ACTIVE", ts(hours_offset=-1), ts_future(hours=23), 45600000, 12300000),
        ("ses_active_002", "pay_om_001", "hot_cafe_001", "pln_cafe_1h", "237655443322", "AA:BB:CC:DD:EE:03",
         "om_655443322", "srv_om_001", "ACTIVE", ts(hours_offset=-5), ts_future(hours=-4), 10240000, 5120000),
        ("ses_active_003", "pay_mtn_003", "hot_boutique_001", "pln_bout_1h", "237670011223", "AA:BB:CC:DD:EE:05",
         "mtn_670011223", "srv_mtn_002", "ACTIVE", ts(hours_offset=-2), ts_future(hours=22), 20480000, 8192000),
        ("ses_expired_001", "pay_mtn_002", "hot_boutique_001", "pln_bout_1j", "237698765432", "AA:BB:CC:DD:EE:02",
         "mtn_698765432", "srv_mtn_003", "EXPIRED", ts_past(days=1), ts_past(hours=-1), 1024000000, 512000000),
        ("ses_pending_001", None, "hot_boutique_001", "pln_bout_3h", "237650000001", None,
         "pending_650000001", "srv_pending_001", "PENDING_MIKROTIK", ts(hours_offset=-1), ts_future(hours=2), 0, 0),
    ]

    lines.append("-- ── SESSIONS ──────────────────────────────")
    for s in sessions:
        lines.append(
            f"INSERT INTO sessions (session_id, payment_id, hotspot_id, plan_id, client_phone, "
            f"client_mac, mikrotik_username, mikrotik_password, status, activated_at, "
            f"expires_at, bytes_in, bytes_out, created_at, updated_at) "
            f"VALUES ({sql_str(s[0])}, {sql_str(s[1])}, {sql_str(s[2])}, {sql_str(s[3])}, "
            f"{sql_str(s[4])}, {sql_str(s[5])}, {sql_str(s[6])}, {sql_str(s[7])}, "
            f"{sql_str(s[8])}, {sql_str(s[9])}, {sql_str(s[10])}, {s[11]}, {s[12]}, "
            f"{sql_str(ts_past(7))}, {sql_str(ts_past(0))});"
        )
    lines.append("")

    # ── WITHDRAWALS ──────────────────────────────────────────
    withdrawals = [
        # (withdrawal_id, user_id, amount, currency, recipient_phone, operator, status, gateway_ref)
        ("wd_001", "usr_admin_001", 25000, "XAF", "237671234567", "MTN_MOMO", "COMPLETED", "WDR-MTN-001"),
        ("wd_002", "usr_admin_001", 10000, "XAF", "237698765432", "ORANGE_MONEY", "PROCESSING", "WDR-OM-002"),
        ("wd_003", "usr_reseller_001", 5000, "XAF", "237698765432", "MTN_MOMO", "PENDING", None),
        ("wd_004", "usr_admin_001", 50000, "XAF", "237671234567", "MTN_MOMO", "COMPLETED", "WDR-MTN-003"),
        ("wd_005", "usr_standard_001", 2000, "XAF", "237655443322", "ORANGE_MONEY", "FAILED", None),
    ]

    lines.append("-- ── WITHDRAWALS ───────────────────────────")
    for w in withdrawals:
        lines.append(
            f"INSERT INTO withdrawals (withdrawal_id, user_id, amount, currency, recipient_phone, "
            f"operator, status, gateway_ref, created_at, updated_at) "
            f"VALUES ({sql_str(w[0])}, {sql_str(w[1])}, {money(w[2])}, {sql_str(w[3])}, "
            f"{sql_str(w[4])}, {sql_str(w[5])}, {sql_str(w[6])}, {sql_str(w[7])}, "
            f"{sql_str(ts_past(14))}, {sql_str(ts_past(0))});"
        )
    lines.append("")

    # ── WEBHOOK EVENTS ───────────────────────────────────────
    webhooks = [
        # (event_id, gateway, payment_reference, gateway_tx_id, status, processed)
        ("wh_mtn_001", "MTN_MOMO", "REF-MTN-001", "MTN-TX-1001", "SUCCESSFUL", True),
        ("wh_mtn_002", "MTN_MOMO", "REF-MTN-003", "MTN-TX-1003", "SUCCESSFUL", True),
        ("wh_om_001", "ORANGE_MONEY", "REF-OM-001", "OM-TX-2001", "SUCCESSFUL", True),
        ("wh_mon_001", "MONEROO", "REF-MON-001", "MON-TX-3001", "SUCCESSFUL", True),
        ("wh_cam_001", "CAMPAY", "REF-CAM-001", "CAM-TX-4001", "SUCCESSFUL", True),
        ("wh_fail_001", "MTN_MOMO", "REF-FAIL-001", "MTN-TX-ERR", "FAILED", False),
    ]

    lines.append("-- ── WEBHOOK EVENTS ────────────────────────")
    for w in webhooks:
        lines.append(
            f"INSERT INTO webhook_events (event_id, gateway, payment_reference, gateway_tx_id, "
            f"status, processed, payload, processed_at, error_message) "
            f"VALUES ({sql_str(w[0])}, {sql_str(w[1])}, {sql_str(w[2])}, {sql_str(w[3])}, "
            f"{sql_str(w[4])}, {'TRUE' if w[5] else 'FALSE'}, "
            f"'{{\"webhook\": \"test\"}}', "
            f"{sql_str(ts_past(1))}, {sql_str(None)});"
        )
    lines.append("")

    # ── ROUTER ACTIONS ───────────────────────────────────────
    router_actions = [
        # (action_id, hotspot_id, action_type, payload, status, session_id)
        ("ra_001", "hot_boutique_001", "CREATE_USER",
         '{"username": "mtn_671234567", "password": "srv_mtn_001", "profile": "default", "comment": "1h - MTN"}',
         "COMPLETED", "ses_active_001"),
        ("ra_002", "hot_cafe_001", "CREATE_USER",
         '{"username": "om_655443322", "password": "srv_om_001", "profile": "default", "comment": "1h - OM"}',
         "COMPLETED", "ses_active_002"),
        ("ra_003", "hot_boutique_001", "CREATE_USER",
         '{"username": "mtn_670011223", "password": "srv_mtn_002", "profile": "default", "comment": "1h - Momo"}',
         "COMPLETED", "ses_active_003"),
        ("ra_004", "hot_boutique_001", "REMOVE_USER",
         '{"username": "mtn_698765432", "comment": "Session expirée"}',
         "COMPLETED", "ses_expired_001"),
        ("ra_005", "hot_boutique_001", "CREATE_USER",
         '{"username": "pending_650000001", "password": "srv_pending_001", "profile": "default"}',
         "PENDING", "ses_pending_001"),
    ]

    lines.append("-- ── ROUTER ACTIONS ─────────────────────────")
    for ra in router_actions:
        lines.append(
            f"INSERT INTO router_actions (action_id, hotspot_id, action_type, payload, status, "
            f"session_id, created_at, updated_at) "
            f"VALUES ({sql_str(ra[0])}, {sql_str(ra[1])}, {sql_str(ra[2])}, "
            f"{sql_str(ra[3])}, {sql_str(ra[4])}, {sql_str(ra[5])}, "
            f"{sql_str(ts_past(7))}, {sql_str(ts_past(0))});"
        )
    lines.append("")

    # ── AUDIT LOGS ───────────────────────────────────────────
    audit_logs = [
        # (user_id, hotspot_id, action, entity_type, entity_id, client_phone, ip_address, details)
        ("usr_admin_001", "hot_boutique_001", "USER_LOGIN", "USER", "usr_admin_001", None, "192.168.1.100", '{"method": "email", "success": true}'),
        ("usr_admin_001", "hot_boutique_001", "CREATE_HOTSPOT", "HOTSPOT", "hot_boutique_001", None, "192.168.1.100", '{"name": "Boutique Express Douala"}'),
        ("usr_admin_001", "hot_boutique_001", "PAYMENT_RECEIVED", "PAYMENT", "pay_mtn_001", "237671234567", "192.168.1.100", '{"amount": 500, "operator": "MTN_MOMO"}'),
        ("usr_admin_001", "hot_boutique_001", "SESSION_ACTIVATED", "SESSION", "ses_active_001", "237671234567", None, '{"plan": "1 Heure", "duration": 60}'),
        ("usr_reseller_001", "hot_reseller_001", "CREATE_PLAN", "PLAN", "pln_hub_1mois", None, "10.0.0.50", '{"name": "1 Mois", "price": 12000}'),
        ("usr_admin_001", "hot_boutique_001", "WITHDRAWAL_REQUESTED", "WITHDRAWAL", "wd_001", None, "192.168.1.100", '{"amount": 25000, "operator": "MTN_MOMO"}'),
    ]

    lines.append("-- ── AUDIT LOGS ─────────────────────────────")
    for al in audit_logs:
        lines.append(
            f"INSERT INTO audit_logs (user_id, hotspot_id, action, entity_type, entity_id, "
            f"client_phone, ip_address, details, created_at) "
            f"VALUES ({sql_str(al[0])}, {sql_str(al[1])}, {sql_str(al[2])}, {sql_str(al[3])}, "
            f"{sql_str(al[4])}, {sql_str(al[5])}, {sql_str(al[6])}, "
            f"{sql_str(al[7])}, {sql_str(ts_past(random.randint(1, 28)))});"
        )
    lines.append("")

    lines.append("COMMIT;")
    lines.append("")
    return "\n".join(lines)


def generate_hotspot_fastapi():
    """Génère les INSERT pour la base hotspot_fastapi (FastAPI)"""
    lines = []
    lines.append("-- =======================================================")
    lines.append("-- HOTSPOTPAY — Données de test pour la base hotspot_fastapi")
    lines.append(f"-- Généré le : {NOW.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    lines.append("-- =======================================================")
    lines.append("")
    lines.append("\\c hotspot_fastapi")
    lines.append("")
    lines.append("BEGIN;")
    lines.append("")

    # ── USERS (FastAPI) ──────────────────────────────────────
    # Note: FastAPI DB stores users separately from Java, so we create matching entries.
    # The id column has no default, so we must provide it explicitly.
    users = [
        ("id_usr_001", "usr_admin_001", "admin@hotspotpay.com", "237671234567", "Jean-Paul Mbarga", "CM", "PREMIUM", True),
        ("id_usr_002", "usr_reseller_001", "reseller@hotspotpay.com", "237698765432", "Marie-Claire Nkolo", "CM", "PRO", True),
        ("id_usr_003", "usr_standard_001", "user@hotspotpay.com", "237655443322", "Pierre Essomba", "CM", "BASIC", True),
        ("id_usr_004", "usr_test_001", "test@hotspotpay.com", "237600000001", "Test Account", "CM", "BASIC", True),
    ]

    lines.append("-- ── USERS ────────────────────────────────")
    lines.append("INSERT INTO users (id, user_id, email, phone, full_name, country, plan_type, is_active, created_at, updated_at) VALUES")
    user_rows = []
    for u in users:
        user_rows.append(
            f"  ({sql_str(u[0])}, {sql_str(u[1])}, {sql_str(u[2])}, {sql_str(u[3])}, {sql_str(u[4])}, "
            f"{sql_str(u[5])}, {sql_str(u[6])}, {'TRUE' if u[7] else 'FALSE'}, "
            f"{sql_str(ts_past(30))}, {sql_str(ts_past(0))})"
        )
    lines.append(",\n".join(user_rows) + ";")
    lines.append("")

    # ── HOTSPOTS (FastAPI) ───────────────────────────────────
    lines.append("-- ── HOTSPOTS ──────────────────────────────")
    lines.append("INSERT INTO hotspots (hotspot_id, user_id, name, location, mikrotik_ip, mikrotik_port, mikrotik_user, mikrotik_password_enc, router_brand, router_type, is_online, router_token, last_ping_at, created_at, updated_at) VALUES")
    fastapi_hotspots = [
        ("hot_boutique_001", "usr_admin_001", "Boutique Express Douala", "Douala, Bonanjo", "192.168.88.1", 8728, "admin", "ENC_FASTAPI_BOUTIQUE", "MikroTik", "hAP AC2", True, "tok_boutique_dla_abc123", ts(hours_offset=-1), ts_past(30), ts_past(0)),
        ("hot_cafe_001", "usr_admin_001", "Café Numérique Yaoundé", "Yaoundé, Mvog-Mbi", "10.0.0.1", 8728, "admin", "ENC_FASTAPI_CAFE", "MikroTik", "RB951", False, None, ts_past(2), ts_past(30), ts_past(0)),
        ("hot_reseller_001", "usr_reseller_001", "Hub Cyber Bafoussam", "Bafoussam, Centre Ville", "172.16.0.1", 8728, "reseller_admin", "ENC_FASTAPI_HUB", "MikroTik", "RB750Gr3", True, "tok_hub_baf_xyz789", ts(hours_offset=-3), ts_past(30), ts_past(0)),
    ]
    hs_rows = []
    for h in fastapi_hotspots:
        hs_rows.append(
            f"  ({sql_str(h[0])}, {sql_str(h[1])}, {sql_str(h[2])}, {sql_str(h[3])}, {sql_str(h[4])}, {h[5]}, {sql_str(h[6])}, {sql_str(h[7])}, {sql_str(h[8])}, {sql_str(h[9])}, {'TRUE' if h[10] else 'FALSE'}, {sql_str(h[11])}, {sql_str(h[12])}, {sql_str(h[13])}, {sql_str(h[14])})"
        )
    lines.append(",\n".join(hs_rows) + ";")
    lines.append("")

    # ── PLANS (FastAPI) ──────────────────────────────────────
    lines.append("-- ── PLANS ─────────────────────────────────")
    fastapi_plans = [
        ("pln_bout_1h", "hot_boutique_001", "1 Heure", 60, "500", "XAF", 1024, 512, None, 1),
        ("pln_bout_1j", "hot_boutique_001", "1 Jour", 1440, "2000", "XAF", 2048, 1024, 500, 2),
        ("pln_cafe_1h", "hot_cafe_001", "1 Heure", 60, "300", "XAF", 512, 256, None, 1),
        ("pln_hub_1h", "hot_reseller_001", "1 Heure", 60, "400", "XAF", 1024, 512, None, 1),
        ("pln_hub_1mois", "hot_reseller_001", "1 Mois", 43200, "12000", "XAF", 8192, 4096, None, 2),
    ]
    for p in fastapi_plans:
        lines.append(
            f"INSERT INTO plans (plan_id, hotspot_id, name, duration_minutes, price, currency, download_speed_kbps, upload_speed_kbps, data_limit_mb, display_order, is_active, created_at, updated_at) "
            f"VALUES ({sql_str(p[0])}, {sql_str(p[1])}, {sql_str(p[2])}, {p[3]}, {sql_str(p[4])}, {sql_str(p[5])}, {p[6]}, {p[7]}, {sql_str(p[8])}, {p[9]}, TRUE, {sql_str(ts_past(30))}, {sql_str(ts_past(0))});"
        )
    lines.append("")

    # ── PAYMENTS (FastAPI) ───────────────────────────────────
    lines.append("-- ── PAYMENTS ──────────────────────────────")
    fastapi_payments = [
        ("pay_mtn_001", "REF-MTN-001", "hot_boutique_001", "pln_bout_1h", "237671234567", "MTN_MOMO", "500", "XAF", "SUCCESS"),
        ("pay_om_001", "REF-OM-001", "hot_cafe_001", "pln_cafe_1h", "237655443322", "ORANGE_MONEY", "300", "XAF", "SUCCESS"),
        ("pay_mon_001", "REF-MON-001", "hot_boutique_001", "pln_bout_1sem", "237671234567", "MONEROO", "5000", "XAF", "SUCCESS"),
        ("pay_pending_001", "REF-PEND-001", "hot_boutique_001", "pln_bout_3h", "237650000001", "MTN_MOMO", "1000", "XAF", "PENDING"),
        ("pay_failed_001", "REF-FAIL-001", "hot_cafe_001", "pln_cafe_3h", "237650000003", "MTN_MOMO", "700", "XAF", "FAILED"),
    ]
    for p in fastapi_payments:
        lines.append(
            f"INSERT INTO payments (payment_id, reference, hotspot_id, plan_id, client_phone, operator, amount, currency, status, created_at, updated_at) "
            f"VALUES ({sql_str(p[0])}, {sql_str(p[1])}, {sql_str(p[2])}, {sql_str(p[3])}, {sql_str(p[4])}, {sql_str(p[5])}, {sql_str(p[6])}, {sql_str(p[7])}, {sql_str(p[8])}, {sql_str(ts_past(7))}, {sql_str(ts_past(0))});"
        )
    lines.append("")

    # ── SESSIONS (FastAPI) ───────────────────────────────────
    lines.append("-- ── SESSIONS ──────────────────────────────")
    fastapi_sessions = [
        ("ses_active_001", "hot_boutique_001", "pln_bout_1h", "pay_mtn_001", "237671234567", "AA:BB:CC:DD:EE:01",
         "mtn_671234567", "srv_mtn_001", "ACTIVE", ts(hours_offset=-1), ts_future(hours=23), 45600000, 12300000),
        ("ses_active_002", "hot_cafe_001", "pln_cafe_1h", "pay_om_001", "237655443322", "AA:BB:CC:DD:EE:03",
         "om_655443322", "srv_om_001", "ACTIVE", ts(hours_offset=-5), ts_future(hours=-4), 10240000, 5120000),
        ("ses_expired_001", "hot_boutique_001", "pln_bout_1j", "pay_mtn_002", "237698765432", "AA:BB:CC:DD:EE:02",
         "mtn_698765432", "srv_mtn_003", "EXPIRED", ts_past(days=1), ts_past(hours=-1), 1024000000, 512000000),
    ]
    for s in fastapi_sessions:
        lines.append(
            f"INSERT INTO sessions (session_id, hotspot_id, plan_id, payment_id, client_phone, client_mac, "
            f"mikrotik_username, mikrotik_password, status, activated_at, expires_at, bytes_in, bytes_out, created_at, updated_at) "
            f"VALUES ({sql_str(s[0])}, {sql_str(s[1])}, {sql_str(s[2])}, {sql_str(s[3])}, {sql_str(s[4])}, {sql_str(s[5])}, "
            f"{sql_str(s[6])}, {sql_str(s[7])}, {sql_str(s[8])}, {sql_str(s[9])}, {sql_str(s[10])}, {s[11]}, {s[12]}, "
            f"{sql_str(ts_past(7))}, {sql_str(ts_past(0))});"
        )
    lines.append("")

    # ── TICKETS (FastAPI) ────────────────────────────────────
    lines.append("-- ── TICKETS ───────────────────────────────")
    fastapi_tickets = [
        ("tkt_001", "hot_boutique_001", "usr_admin_001", "voucher_bout_001", "vouch123", "Voucher 1h", "AVAILABLE"),
        ("tkt_002", "hot_boutique_001", "usr_admin_001", "voucher_bout_002", "vouch456", "Voucher 3h", "AVAILABLE"),
        ("tkt_004", "hot_reseller_001", "usr_reseller_001", "hub_v_001", "hubpass01", "Ticket réunion", "AVAILABLE"),
    ]
    for t in fastapi_tickets:
        lines.append(
            f"INSERT INTO tickets (ticket_id, hotspot_id, user_id, username, password, comment, status, created_at, updated_at) "
            f"VALUES ({sql_str(t[0])}, {sql_str(t[1])}, {sql_str(t[2])}, {sql_str(t[3])}, {sql_str(t[4])}, {sql_str(t[5])}, {sql_str(t[6])}, "
            f"{sql_str(ts_past(7))}, {sql_str(ts_past(0))});"
        )
    lines.append("")

    # ── ROUTER ACTIONS (FastAPI) ─────────────────────────────
    lines.append("-- ── ROUTER ACTIONS ────────────────────────")
    fastapi_router_actions = [
        ("ra_001", "hot_boutique_001", "CREATE_USER", "mtn_671234567", "srv_mtn_001", "default", None, None, None, "ACK_SUCCESS"),
        ("ra_002", "hot_cafe_001", "CREATE_USER", "om_655443322", "srv_om_001", "default", None, None, None, "ACK_SUCCESS"),
        ("ra_005", "hot_boutique_001", "CREATE_USER", "pending_650000001", "srv_pending_001", "default", None, None, None, "PENDING"),
    ]
    for ra in fastapi_router_actions:
        lines.append(
            f"INSERT INTO router_actions (action_id, hotspot_id, action_type, username, password, profile, "
            f"status, created_at, delivered_at, ack_at) "
            f"VALUES ({sql_str(ra[0])}, {sql_str(ra[1])}, {sql_str(ra[2])}, {sql_str(ra[3])}, {sql_str(ra[4])}, {sql_str(ra[5])}, "
            f"{sql_str(ra[6])}, {sql_str(ts_past(7))}, "
            f"{sql_str(ts_past(6))}, {sql_str(ts_past(6))});"
        )
    lines.append("")

    lines.append("COMMIT;")
    lines.append("")
    return "\n".join(lines)


# ── Main ────────────────────────────────────────────────────
if __name__ == "__main__":
    print(generate_hotspot_pay())
    print(generate_hotspot_fastapi())
    print("-- ✅ Données de test générées avec succès.")
