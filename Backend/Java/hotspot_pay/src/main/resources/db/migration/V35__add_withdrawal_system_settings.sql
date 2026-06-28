-- ═══════════════════════════════════════════════════════
-- V35 : Ajout des paramètres de retrait (withdrawals)
-- dans system_settings (table déjà existante avec données)
-- ═══════════════════════════════════════════════════════

INSERT INTO system_settings (setting_key, section_key, section_label, label, description, value_type, value, is_secret, is_editable, created_at, updated_at)
VALUES
    ('withdrawals.enabled',      'withdrawals', 'Retraits', 'Retraits activés',            'Active ou désactive les demandes de retrait.',                                                                  'switch', 'true',    false, true, NOW(), NOW()),
    ('withdrawals.minAmount',    'withdrawals', 'Retraits', 'Montant minimum',              'Montant minimum d''un retrait en XAF.',                                                                          'number', '1000',    false, true, NOW(), NOW()),
    ('withdrawals.maxAmount',    'withdrawals', 'Retraits', 'Montant maximum',              'Montant maximum d''un retrait en XAF.',                                                                          'number', '500000',  false, true, NOW(), NOW()),
    ('withdrawals.feeFixed',     'withdrawals', 'Retraits', 'Frais fixes',                  'Frais fixes appliqués à chaque retrait en XAF.',                                                                  'number', '0',       false, true, NOW(), NOW()),
    ('withdrawals.feePercentage','withdrawals', 'Retraits', 'Frais en %',                   'Pourcentage de frais sur le montant du retrait.',                                                                 'number', '1.5',     false, true, NOW(), NOW()),
    ('withdrawals.methods',      'withdrawals', 'Retraits', 'Méthodes disponibles',         'Méthodes de retrait séparées par une virgule (orange,mtn,airtel).',                                                 'text',   'orange,mtn', false, true, NOW(), NOW())
ON CONFLICT (setting_key) DO NOTHING;
