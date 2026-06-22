INSERT INTO system_settings (setting_key, section_key, section_label, label, description, value_type, value, is_secret, is_editable, created_at, updated_at)
VALUES
    ('support.whatsappNumber', 'support', 'Support', 'Numéro WhatsApp', 'Numéro WhatsApp affiché sur la page Aide & Support.', 'text', '+237 6XX XXX XXX', false, true, now(), now()),
    ('support.docsEnabled', 'support', 'Support', 'Documentation activée', 'Affiche ou masque la section Documentation sur la page Aide & Support.', 'switch', 'true', false, true, now(), now()),
    ('support.docsUrl', 'support', 'Support', 'URL documentation', 'Lien vers la documentation utilisateur.', 'url', '/docs', false, true, now(), now())
ON CONFLICT (setting_key) DO NOTHING;
