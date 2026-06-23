-- ═══════════════════════════════════════════════════════
-- V28 : Paramètres support & contact (section 'support')
-- ═══════════════════════════════════════════════════════

INSERT INTO system_settings (setting_key, section_key, section_label, label, description, value_type, value, is_secret, is_editable) VALUES
    ('support.email',    'support', 'Support et Contact', 'Email support',     'Email public pour les demandes de support.',   'email', 'support@hotspotpay.cm', FALSE, TRUE),
    ('support.phone',    'support', 'Support et Contact', 'Téléphone support', 'Numéro de téléphone du support.',             'text',  '+237612345678',       FALSE, TRUE),
    ('support.whatsapp', 'support', 'Support et Contact', 'WhatsApp support',  'Numéro WhatsApp pour le support client.',     'text',  '+237612345678',       FALSE, TRUE),
    ('support.hours',    'support', 'Support et Contact', 'Horaires support',  'Horaires d''ouverture du service support.',   'text',  'Lun-Sam 8h-20h',       FALSE, TRUE)
ON CONFLICT (setting_key) DO NOTHING;
