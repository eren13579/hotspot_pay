-- Ajoute les colonnes manquantes dans la table hotspots
-- L'entité JPA Hotspot.java référence ces colonnes mais elles n'existaient pas en base
ALTER TABLE hotspots ADD COLUMN IF NOT EXISTS router_brand VARCHAR(100) DEFAULT 'mikrotik';
ALTER TABLE hotspots ADD COLUMN IF NOT EXISTS router_type VARCHAR(100);
