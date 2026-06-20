-- ═══════════════════════════════════════════════════════
-- V25 : Paramètres système admin
-- Paramètres opérationnels modifiables depuis l'interface admin
-- Les secrets sont stockés mais masqués dans les réponses API
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system_settings
(
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    setting_key     VARCHAR(120) NOT NULL,
    section_key     VARCHAR(80)  NOT NULL,
    section_label   VARCHAR(100) NOT NULL,
    label           VARCHAR(120) NOT NULL,
    description     TEXT,
    value_type      VARCHAR(20)  NOT NULL,
    value           TEXT,
    is_secret       BOOLEAN      NOT NULL DEFAULT FALSE,
    is_editable     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_system_settings PRIMARY KEY (id),
    CONSTRAINT uq_system_settings_key UNIQUE (setting_key)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_section ON system_settings (section_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_secret ON system_settings (is_secret);

INSERT INTO system_settings (setting_key, section_key, section_label, label, description, value_type, value, is_secret, is_editable) VALUES
    ('app.name', 'general', 'Général', 'Nom de l''application', 'Nom affiché dans l''interface et les emails.', 'text', 'HotspotPay', FALSE, TRUE),
    ('app.supportEmail', 'general', 'Général', 'Email support', 'Email affiché pour le support client.', 'email', 'support@hotspotpay.cm', FALSE, TRUE),
    ('app.maintenanceMode', 'general', 'Général', 'Mode maintenance', 'Active ou désactive l''accès public à l''application.', 'switch', 'false', FALSE, TRUE),
    ('app.registrationEnabled', 'general', 'Général', 'Inscriptions activées', 'Autorise ou bloque les nouvelles inscriptions.', 'switch', 'true', FALSE, TRUE),

    ('branding.logoUrl', 'branding', 'Marque et présentation', 'URL du logo', 'URL publique ou chemin du logo de l''application.', 'url', '', FALSE, TRUE),
    ('branding.primaryColor', 'branding', 'Marque et présentation', 'Couleur principale', 'Couleur principale utilisée dans le branding.', 'text', '#2563EB', FALSE, TRUE),
    ('branding.faviconUrl', 'branding', 'Marque et présentation', 'URL du favicon', 'URL publique ou chemin du favicon.', 'url', '', FALSE, TRUE),

    ('about.enabled', 'about', 'À propos', 'Section À propos activée', 'Affiche ou masque la section À propos sur les pages publiques.', 'switch', 'true', FALSE, TRUE),
    ('about.title', 'about', 'À propos', 'Titre À propos', 'Titre principal de la section À propos.', 'text', 'Gérez vos hotspots et paiements simplement', FALSE, TRUE),
    ('about.subtitle', 'about', 'À propos', 'Sous-titre À propos', 'Phrase courte affichée sous le titre.', 'text', 'HotspotPay centralise les ventes WiFi, les sessions et les retraits.', FALSE, TRUE),
    ('about.description', 'about', 'À propos', 'Description À propos', 'Texte détaillé de présentation de HotspotPay.', 'text', 'HotspotPay aide les gérants de hotspots WiFi à vendre des accès internet, suivre les paiements mobile money et gérer les sessions clients depuis un tableau de bord clair.', FALSE, TRUE),
    ('about.photoUrls', 'about', 'À propos', 'Photos À propos', 'Liste JSON des URLs ou chemins des photos affichées dans la section À propos.', 'json', '["/about/hotspot-1.jpg","/about/hotspot-2.jpg","/about/hotspot-3.jpg"]', FALSE, TRUE),

    ('payments.campay.enabled', 'payments', 'Paiements', 'Campay activé', 'Active ou désactive Campay comme fournisseur de paiement.', 'switch', 'true', FALSE, TRUE),
    ('payments.campay.baseUrl', 'payments', 'Paiements', 'Campay base URL', 'URL de l''API Campay.', 'url', 'https://demo.campay.net', FALSE, TRUE),
    ('payments.campay.username', 'payments', 'Paiements', 'Campay username', 'Identifiant Campay.', 'text', '', FALSE, TRUE),
    ('payments.campay.password', 'payments', 'Paiements', 'Campay password', 'Mot de passe Campay. Laisser vide pour conserver.', 'password', '', TRUE, TRUE),
    ('payments.moneroo.enabled', 'payments', 'Paiements', 'Moneroo activé', 'Active ou désactive Moneroo comme fournisseur de paiement.', 'switch', 'false', FALSE, TRUE),
    ('payments.moneroo.baseUrl', 'payments', 'Paiements', 'Moneroo base URL', 'URL de l''API Moneroo.', 'url', 'https://api.moneroo.io', FALSE, TRUE),
    ('payments.moneroo.apiKey', 'payments', 'Paiements', 'Moneroo API key', 'Clé API Moneroo. Laisser vide pour conserver.', 'password', '', TRUE, TRUE),
    ('payments.moneroo.currency', 'payments', 'Paiements', 'Devise Moneroo', 'Devise utilisée pour Moneroo.', 'text', 'XAF', FALSE, TRUE),
    ('payments.moneroo.methods', 'payments', 'Paiements', 'Méthodes Moneroo', 'Méthodes de paiement séparées par une virgule.', 'text', 'mtn_cm,orange_cm', FALSE, TRUE),

    ('fastapi.baseUrl', 'fastapi', 'FastAPI et routeurs', 'FastAPI base URL', 'URL du microservice FastAPI utilisé par les routeurs.', 'url', 'http://localhost:8444', FALSE, TRUE),
    ('fastapi.apiKey', 'fastapi', 'FastAPI et routeurs', 'FastAPI API key', 'Clé API FastAPI. Laisser vide pour conserver.', 'password', '', TRUE, TRUE),
    ('fastapi.callbackSecret', 'fastapi', 'FastAPI et routeurs', 'FastAPI callback secret', 'Secret de callback FastAPI. Laisser vide pour conserver.', 'password', '', TRUE, TRUE),
    ('fastapi.pollingEnabled', 'fastapi', 'FastAPI et routeurs', 'Polling routeurs activé', 'Active le polling automatique vers le service routeurs.', 'switch', 'true', FALSE, TRUE),

    ('portal.pollingIntervalSeconds', 'portal', 'Portail captif', 'Intervalle polling portail', 'Nombre de secondes entre deux vérifications de paiement.', 'number', '5', FALSE, TRUE),
    ('portal.pollingMaxAttempts', 'portal', 'Portail captif', 'Tentatives max polling', 'Nombre maximum de tentatives avant échec.', 'number', '36', FALSE, TRUE),
    ('portal.sessionActivationRetry', 'portal', 'Portail captif', 'Retours activation session', 'Nombre de tentatives d''activation de session.', 'number', '3', FALSE, TRUE),

    ('security.corsAllowedOrigins', 'security', 'Sécurité', 'Origines CORS', 'Origines autorisées, séparées par une virgule.', 'text', '*', FALSE, TRUE),
    ('security.webhookAllowedIps', 'security', 'Sécurité', 'IP webhooks autorisées', 'IP autorisées pour les webhooks, séparées par une virgule.', 'text', '*', FALSE, TRUE),
    ('security.routerCallbackAllowedIps', 'security', 'Sécurité', 'IP callbacks routeurs', 'IP autorisées pour les callbacks routeurs, séparées par une virgule.', 'text', '*', FALSE, TRUE),
    ('security.rateLimitPortalPerMinute', 'security', 'Sécurité', 'Rate limit portail', 'Nombre max de requêtes portail par minute.', 'number', '100', FALSE, TRUE),
    ('security.rateLimitAuthPerMinute', 'security', 'Sécurité', 'Rate limit auth', 'Nombre max de requêtes auth par minute.', 'number', '100', FALSE, TRUE),
    ('security.rateLimitWebhookPerMinute', 'security', 'Sécurité', 'Rate limit webhooks', 'Nombre max de requêtes webhooks par minute.', 'number', '100', FALSE, TRUE),

    ('notifications.mailEnabled', 'notifications', 'Notifications', 'Emails activés', 'Active ou désactive l''envoi d''emails.', 'switch', 'false', FALSE, TRUE),
    ('notifications.mailHost', 'notifications', 'Notifications', 'SMTP host', 'Hôte SMTP.', 'text', 'smtp.hostinger.com', FALSE, TRUE),
    ('notifications.mailPort', 'notifications', 'Notifications', 'SMTP port', 'Port SMTP.', 'number', '587', FALSE, TRUE),
    ('notifications.mailUsername', 'notifications', 'Notifications', 'SMTP username', 'Identifiant SMTP.', 'text', '', FALSE, TRUE),
    ('notifications.mailPassword', 'notifications', 'Notifications', 'SMTP password', 'Mot de passe SMTP. Laisser vide pour conserver.', 'password', '', TRUE, TRUE),
    ('notifications.mailFrom', 'notifications', 'Notifications', 'Email expéditeur', 'Email utilisé comme expéditeur.', 'email', 'no-reply@hotspotpay.cm', FALSE, TRUE)
ON CONFLICT (setting_key) DO NOTHING;
