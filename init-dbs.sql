-- ============================================================
-- HotspotPay — Script d'initialisation des bases de données
-- Exécuté automatiquement au premier démarrage de PostgreSQL
-- ============================================================

-- Création de la base pour le microservice FastAPI
-- (la base hotspot_pay pour Java est créée via POSTGRES_DB)
SELECT 'CREATE DATABASE hotspot_fastapi'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotspot_fastapi')\gexec

-- Création de la base pour Java (si POSTGRES_DB différent)
SELECT 'CREATE DATABASE hotspot_pay'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hotspot_pay')\gexec
