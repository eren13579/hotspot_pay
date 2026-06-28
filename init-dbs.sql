-- ============================================================
-- HotspotPay — Script d'initialisation des bases de données
-- Exécuté automatiquement au premier démarrage de PostgreSQL
-- ============================================================

-- Création de hotspot_fastapi pour le microservice FastAPI
SELECT 'CREATE DATABASE hotspot_fastapi'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotspot_fastapi')\gexec

-- Création de hotspotPay_V2 pour Java (si POSTGRES_DB différent)
SELECT 'CREATE DATABASE "hotspotPay_V2"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotspotPay_V2')\gexec

-- Création de hotspot_pay (fallback legacy)
SELECT 'CREATE DATABASE hotspot_pay'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotspot_pay')\gexec
