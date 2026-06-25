-- V40__drop_payment_fk_constraints.sql
-- Supprime les contraintes FK sur payments qui bloquent en environnement multi-base
-- (FastAPI = source de verite pour hotspots/plans, Java valide deja via API)
-- Ces FK empechent les paiements si le plan n'existe que dans FastAPI.

ALTER TABLE payments DROP CONSTRAINT IF EXISTS fk_payments_hotspot;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS fk_payments_plan;
