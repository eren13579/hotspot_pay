-- Ajout de la colonne advantages JSONB pour les fonctionnalités des plans
ALTER TABLE subscription_plans
    ADD COLUMN advantages jsonb;

-- Seed des avantages pour les 3 plans par défaut
UPDATE subscription_plans
SET advantages = '{
  "maxHotspots": 1,
  "plansPerHotspot": 5,
  "monthlyTickets": 100,
  "exportCsv": false,
  "apiAccess": false,
  "advancedStats": false,
  "prioritySupport": false,
  "unlimitedHotspots": false,
  "unlimitedTickets": false,
  "unlimitedPlans": false
}'::jsonb
WHERE plan_name = 'BASIC';

UPDATE subscription_plans
SET advantages = '{
  "maxHotspots": 10,
  "plansPerHotspot": 999,
  "monthlyTickets": 10000,
  "exportCsv": true,
  "apiAccess": "read",
  "advancedStats": true,
  "prioritySupport": false,
  "unlimitedHotspots": false,
  "unlimitedTickets": false,
  "unlimitedPlans": true
}'::jsonb
WHERE plan_name = 'PRO';

UPDATE subscription_plans
SET advantages = '{
  "maxHotspots": 999,
  "plansPerHotspot": 999,
  "monthlyTickets": 999999,
  "exportCsv": true,
  "apiAccess": "full",
  "advancedStats": true,
  "prioritySupport": true,
  "unlimitedHotspots": true,
  "unlimitedTickets": true,
  "unlimitedPlans": true
}'::jsonb
WHERE plan_name = 'PREMIUM';
