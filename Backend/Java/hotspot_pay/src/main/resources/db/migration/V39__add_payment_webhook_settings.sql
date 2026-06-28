-- ═══════════════════════════════════════════════════════
-- V39 : Ajout des paramètres webhook pour Campay et Moneroo
--       + section webhooks dédiée
-- ═══════════════════════════════════════════════════════
-- Note : les clés payments.campay.username, .password,
--        payments.moneroo.apiKey existent déjà dans V25.
--        On ajoute ici uniquement les nouvelles clés manquantes.

INSERT INTO system_settings (setting_key, section_key, section_label, label, description, value_type, value, is_secret, is_editable)
VALUES
    -- ── Campay complément ──
    ('payments.campay.webhookUrl', 'payments', 'Paiements', 'Campay webhook URL',
     'URL de callback webhook pour recevoir les notifications Campay.', 'url',
     'http://localhost:8080/api/V1/payments/campay/webhook', FALSE, TRUE),
    ('payments.campay.apiUsername', 'payments', 'Paiements', 'Campay API username',
     'Nom d''utilisateur de l''API Campay (app_username).', 'text', '', FALSE, TRUE),
    ('payments.campay.apiPassword', 'payments', 'Paiements', 'Campay API password',
     'Mot de passe de l''API Campay (app_password).', 'password', '', TRUE, TRUE),

    -- ── Moneroo complément ──
    ('payments.moneroo.webhookUrl', 'payments', 'Paiements', 'Moneroo webhook URL',
     'URL de callback webhook pour recevoir les notifications Moneroo.', 'url',
     'http://localhost:8080/api/V1/payments/moneroo/webhook', FALSE, TRUE),

    -- ── Section webhooks (affichage dédié dans l'interface) ──
    ('webhooks.campay.url', 'webhooks', 'Webhooks', 'Campay webhook URL',
     'URL utilisée par Campay pour notifier les statuts de paiement.', 'url',
     'http://localhost:8080/api/V1/payments/campay/webhook', FALSE, TRUE),
    ('webhooks.campay.description', 'webhooks', 'Webhooks', 'À propos',
     'Description du webhook Campay.', 'text',
     'Reçoit les confirmations de paiement Campay (MTN/Orange).', FALSE, TRUE),
    ('webhooks.moneroo.url', 'webhooks', 'Webhooks', 'Moneroo webhook URL',
     'URL utilisée par Moneroo pour notifier les statuts de paiement.', 'url',
     'http://localhost:8080/api/V1/payments/moneroo/webhook', FALSE, TRUE),
    ('webhooks.moneroo.description', 'webhooks', 'Webhooks', 'À propos',
     'Description du webhook Moneroo.', 'text',
     'Reçoit les confirmations de paiement Moneroo.', FALSE, TRUE),
    ('webhooks.mtn.url', 'webhooks', 'Webhooks', 'MTN Mobile Money webhook URL',
     'URL webhook pour les notifications directes MTN Mobile Money.', 'url',
     'http://localhost:8080/api/V1/payments/mtn/webhook', FALSE, TRUE),
    ('webhooks.mtn.description', 'webhooks', 'Webhooks', 'À propos',
     'Description du webhook MTN.', 'text',
     'Reçoit les confirmations MTN Mobile Money.', FALSE, TRUE),
    ('webhooks.orange.url', 'webhooks', 'Webhooks', 'Orange Money webhook URL',
     'URL webhook pour les notifications directes Orange Money.', 'url',
     'http://localhost:8080/api/V1/payments/orange/webhook', FALSE, TRUE),
    ('webhooks.orange.description', 'webhooks', 'Webhooks', 'À propos',
     'Description du webhook Orange.', 'text',
     'Reçoit les confirmations Orange Money.', FALSE, TRUE)
ON CONFLICT (setting_key) DO NOTHING;
