"""
Migration script: copy hotspots, users, tickets from hotspotPay_V2 to hotspot_fastapi.

Run once after deployment:
    cd "F:/Teda patrick/HOSPOT-FASTAPI-SERVICE"
    python scripts/migrate_data.py

Requirements: pip install psycopg2-binary (or use psycopg2)
"""

import json
import uuid
from datetime import datetime

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("Installing psycopg2-binary...")
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
    import psycopg2
    import psycopg2.extras

DB_PARAMS = {
    "host": "127.0.0.1",
    "port": 5432,
    "user": "postgres",
    "password": "Teda@2003",
}

SOURCE_DB = "hotspotPay_V2"
TARGET_DB = "hotspot_fastapi"

LOG_PREFIX = "[MIGRATE]"


def log(msg):
    print(f"{LOG_PREFIX} {datetime.now().strftime('%H:%M:%S')} {msg}")


def connect(dbname):
    conn = psycopg2.connect(dbname=dbname, **DB_PARAMS)
    conn.autocommit = False
    return conn


def table_exists(cursor, table):
    cursor.execute(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = %s) AS flag",
        (table,),
    )
    row = cursor.fetchone()
    if isinstance(row, dict):
        return row.get("flag", False)
    return row[0] if row else False


def count_rows(cursor, table):
    cursor.execute(f"SELECT COUNT(*) FROM {table}")
    return cursor.fetchone()[0]


def migrate_users(src, dst):
    """Copy users from hotspotPay_V2 to hotspot_fastapi (only new user_ids)."""
    src_cursor = src.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    dst_cursor = dst.cursor()

    if not table_exists(src_cursor, "users"):
        log("Source table 'users' does not exist, skipping.")
        return

    # Get existing user_ids in target
    dst_cursor.execute("SELECT user_id FROM users")
    existing = {row[0] for row in dst_cursor.fetchall()}
    log(f"Existing users in target: {len(existing)}")

    # Get users from source
    src_cursor.execute("""
        SELECT id, user_id, email, phone, full_name, country, plan_type,
               is_active, created_at, updated_at
        FROM users
    """)
    new_count = 0
    for row in src_cursor:
        if row["user_id"] in existing:
            continue
        dst_cursor.execute(
            """
            INSERT INTO users (id, user_id, email, phone, full_name, country,
                               plan_type, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                str(row["id"]),
                row["user_id"],
                row["email"],
                row["phone"],
                row["full_name"],
                row["country"],
                row.get("plan_type", "BASIC"),
                row.get("is_active", True),
                row["created_at"] or datetime.utcnow(),
                row["updated_at"] or datetime.utcnow(),
            ),
        )
        new_count += 1
    dst.commit()
    log(f"Migrated users: {new_count} new, {len(existing)} already exist")


def migrate_hotspots(src, dst):
    """Copy hotspots from hotspotPay_V2 to hotspot_fastapi."""
    src_cursor = src.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    dst_cursor = dst.cursor()

    if not table_exists(src_cursor, "hotspots"):
        log("Source table 'hotspots' does not exist, skipping.")
        return

    # Get existing hotspot_ids in target
    dst_cursor.execute("SELECT hotspot_id FROM hotspots")
    existing = {row[0] for row in dst_cursor.fetchall()}
    log(f"Existing hotspots in target: {len(existing)}")

    # Get all columns from source
    src_cursor.execute("""
        SELECT id, hotspot_id, user_id, name, location,
               mikrotik_ip, mikrotik_port, mikrotik_user, mikrotik_password_enc,
               hotspot_profile, router_brand, router_type,
               is_online, router_token, model_id,
               last_ping_at, created_at, updated_at
        FROM hotspots
    """)
    new_count = 0
    for row in src_cursor:
        if row["hotspot_id"] in existing:
            continue

        # Handle model_id: could be UUID or None
        model_id = row.get("model_id")
        if model_id:
            model_id = str(model_id)

        dst_cursor.execute(
            """
            INSERT INTO hotspots (
                id, hotspot_id, user_id, name, location,
                mikrotik_ip, mikrotik_port, mikrotik_user, mikrotik_password_enc,
                hotspot_profile, router_brand, router_type,
                is_online, router_token, model_id,
                last_ping_at, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s
            )
            """,
            (
                str(row["id"]),
                row["hotspot_id"],
                row["user_id"],
                row["name"],
                row.get("location"),
                row["mikrotik_ip"],
                row.get("mikrotik_port", 8728),
                row["mikrotik_user"],
                row["mikrotik_password_enc"],
                row.get("hotspot_profile", "default"),
                row.get("router_brand", "mikrotik"),
                row.get("router_type"),
                row.get("is_online", False),
                row.get("router_token"),
                model_id,
                row.get("last_ping_at"),
                row["created_at"] or datetime.utcnow(),
                row["updated_at"] or datetime.utcnow(),
            ),
        )
        new_count += 1
    dst.commit()
    log(f"Migrated hotspots: {new_count} new, {len(existing)} already exist")


def migrate_tickets(src, dst):
    """Copy tickets from hotspotPay_V2 to hotspot_fastapi."""
    src_cursor = src.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    dst_cursor = dst.cursor()

    if not table_exists(src_cursor, "tickets"):
        log("Source table 'tickets' does not exist, skipping.")
        return

    # Get existing ticket_ids in target
    dst_cursor.execute("SELECT ticket_id FROM tickets")
    existing = {row[0] for row in dst_cursor.fetchall()}
    log(f"Existing tickets in target: {len(existing)}")

    src_cursor.execute("""
        SELECT id, ticket_id, hotspot_id, user_id, username, password,
               profile, uptime_limit AS time_limit, data_limit, comment, status,
               client_mac, client_phone, used_at, expires_at,
               created_at, updated_at
        FROM tickets
    """)
    new_count = 0
    for row in src_cursor:
        if row["ticket_id"] in existing:
            continue

        # Map status: Java might use slightly different status values
        status = row.get("status", "AVAILABLE")
        status_map = {"NEW": "AVAILABLE", "USED": "USED", "EXPIRED": "EXPIRED"}
        status = status_map.get(status, status)

        dst_cursor.execute(
            """
            INSERT INTO tickets (
                id, ticket_id, hotspot_id, user_id, username, password,
                profile, time_limit, data_limit, comment, status,
                session_id, client_mac, client_phone, used_at, expires_at,
                created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s
            )
            """,
            (
                str(row["id"]),
                row["ticket_id"],
                row["hotspot_id"],
                row["user_id"],
                row["username"],
                row["password"],
                row.get("profile", "default"),
                row.get("time_limit"),
                row.get("data_limit"),
                row.get("comment"),
                status,
                row.get("session_id"),
                row.get("client_mac"),
                row.get("client_phone"),
                row.get("used_at"),
                row.get("expires_at"),
                row["created_at"] or datetime.utcnow(),
                row["updated_at"] or datetime.utcnow(),
            ),
        )
        new_count += 1
    dst.commit()
    log(f"Migrated tickets: {new_count} new, {len(existing)} already exist")


def main():
    log("Starting data migration from hotspotPay_V2 to hotspot_fastapi")
    log("=" * 60)

    src = connect(SOURCE_DB)
    dst = connect(TARGET_DB)

    try:
        migrate_users(src, dst)
        migrate_hotspots(src, dst)
        migrate_tickets(src, dst)

        log("=" * 60)
        log("Migration complete!")

        # Summary
        cur = dst.cursor()
        for table in ["users", "hotspots", "tickets", "plans", "sessions", "payments"]:
            if table_exists(cur, table):
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                log(f"  {table}: {cur.fetchone()[0]} rows")
    finally:
        src.close()
        dst.close()


if __name__ == "__main__":
    main()
