-- ═══════════════════════════════════════════════════════
-- V41 : Ajout des URLs de retour/notification paiement
-- Permet de configurer les URLs de callback depuis l'admin
-- ═══════════════════════════════════════════════════════

INSERT INTO system_settings (setting_key, section_key, section_label, label, description, value_type, value, is_secret, is_editable) VALUES
    ('payments.moneroo.returnUrl', 'payments', 'Paiements', 'Moneroo URL de retour', 'URL où l''utilisateur est redirigé après un paiement Moneroo.', 'url', 'http://localhost:8080/api/V1/portal/status', FALSE, TRUE),
    ('payments.moneroo.notifyUrl', 'payments', 'Paiements', 'Moneroo URL de notification', 'URL webhook appelée par Moneroo pour notifier les événements de paiement.', 'url', 'http://localhost:8080/api/V1/payments/moneroo/webhook', FALSE, TRUE),
    ('payments.moneroo.webhookSecret', 'payments', 'Paiements', 'Moneroo secret webhook', 'Secret utilisé pour vérifier la signature des webhooks Moneroo (X-Moneroo-Signature).', 'password', '', TRUE, TRUE),

    ('payments.campay.callbackUrl', 'payments', 'Paiements', 'Campay URL de callback', 'URL appelée par Campay pour notifier le statut du paiement.', 'url', 'http://localhost:8080/api/V1/payments/campay/webhook', FALSE, TRUE),
    ('payments.campay.redirectUrl', 'payments', 'Paiements', 'Campay URL de redirection', 'URL où l''utilisateur est redirigé après un paiement Campay.', 'url', 'http://localhost:8080/api/V1/portal/status', FALSE, TRUE),
    ('payments.campay.failureRedirectUrl', 'payments', 'Paiements', 'Campay URL d''échec', 'URL de redirection en cas d''échec de paiement Campay.', 'url', 'http://localhost:8080/api/V1/portal/status?status=failed', FALSE, TRUE),
    ('payments.campay.permanentToken', 'payments', 'Paiements', 'Campay token permanent', 'Token permanent Campay (APP KEYS). Laisser vide pour utiliser identifiant/mot de passe.', 'password', '', TRUE, TRUE)

ON CONFLICT (setting_key) DO NOTHING;
