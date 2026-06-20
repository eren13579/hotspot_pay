-- V17__add_plan_hotspot_profile.sql
-- Permet d'associer un profil MikroTik HotSpot spécifique à chaque forfait.
-- Ce profil est transmis au routeur dans RouterActionPayload.hotspotProfile
-- et utilisé lors de la création du user HotSpot : /ip hotspot user add profile=...

ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS hotspot_profile VARCHAR(100) DEFAULT 'default';

COMMENT ON COLUMN plans.hotspot_profile IS
    'Profil MikroTik HotSpot à appliquer (ex: "default", "premium", "unlimited"). '
    'Transmis dans RouterActionPayload lors de CREATE_USER.';
