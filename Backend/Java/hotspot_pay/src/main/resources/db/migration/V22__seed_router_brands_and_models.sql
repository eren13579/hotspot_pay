-- ═══════════════════════════════════════════════════════
-- V22 : Données initiales — marques et modèles de routeurs
-- ═══════════════════════════════════════════════════════

-- Marques
INSERT INTO router_brands (name, slug, description, logo_url, is_active) VALUES
('MikroTik',    'mikrotik',    'Routeurs professionnels RouterOS — le standard des hotspots WiFi et WISP', NULL, TRUE),
('TP-Link',     'tp-link',     'Routeurs et points d''accès abordables, largement utilisés en Afrique',    NULL, TRUE),
('Ubiquiti',    'ubiquiti',    'Équipements WISP professionnels — UniFi, AirMax, NanoStation',           NULL, TRUE),
('Huawei',      'huawei',      'Routeurs 4G/5G et hotspots mobiles — très répandus chez les opérateurs',  NULL, TRUE),
('Tenda',       'tenda',       'Routeurs grand public, bonne couverture dans les petits cybercafés',      NULL, TRUE),
('ZTE',         'zte',         'Routeurs 4G/5G, souvent fournis par les opérateurs télécoms',              NULL, TRUE),
('Cisco',       'cisco',       'Équipements entreprises — routeurs haut de gamme et switches managés',   NULL, TRUE),
('D-Link',      'd-link',      'Routeurs et points d''accès pour PME et usage domestique',                 NULL, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- MikroTik : modèles
INSERT INTO router_models (brand_id, name, slug, connection_type, default_port, is_active)
SELECT b.id, 'hAP ac²',      'hap-ac2',      'api',  8728, TRUE FROM router_brands b WHERE b.slug = 'mikrotik' UNION ALL
SELECT b.id, 'hAP ax²',      'hap-ax2',      'api',  8728, TRUE FROM router_brands b WHERE b.slug = 'mikrotik' UNION ALL
SELECT b.id, 'hAP Lite',     'hap-lite',     'api',  8728, TRUE FROM router_brands b WHERE b.slug = 'mikrotik' UNION ALL
SELECT b.id, 'RB951Ui',      'rb951',        'api',  8728, TRUE FROM router_brands b WHERE b.slug = 'mikrotik' UNION ALL
SELECT b.id, 'RB2011',       'rb2011',       'api',  8728, TRUE FROM router_brands b WHERE b.slug = 'mikrotik' UNION ALL
SELECT b.id, 'CCR1009',      'ccr1009',      'api',  8728, TRUE FROM router_brands b WHERE b.slug = 'mikrotik' UNION ALL
SELECT b.id, 'SXT LTE',      'sxt-lte',      'api',  8728, TRUE FROM router_brands b WHERE b.slug = 'mikrotik' UNION ALL
SELECT b.id, 'mAP Lite',     'map-lite',     'api',  8728, TRUE FROM router_brands b WHERE b.slug = 'mikrotik' UNION ALL
SELECT b.id, 'RB4011',       'rb4011',       'api',  8728, TRUE FROM router_brands b WHERE b.slug = 'mikrotik' UNION ALL
SELECT b.id, 'Chateau 5G',   'chateau-5g',   'api',  8728, TRUE FROM router_brands b WHERE b.slug = 'mikrotik'
ON CONFLICT (brand_id, slug) DO NOTHING;

-- TP-Link : modèles
INSERT INTO router_models (brand_id, name, slug, connection_type, default_port, is_active)
SELECT b.id, 'EAP225',          'eap225',          'http',    80,   TRUE FROM router_brands b WHERE b.slug = 'tp-link' UNION ALL
SELECT b.id, 'EAP245',          'eap245',          'http',    80,   TRUE FROM router_brands b WHERE b.slug = 'tp-link' UNION ALL
SELECT b.id, 'EAP610',          'eap610',          'http',    80,   TRUE FROM router_brands b WHERE b.slug = 'tp-link' UNION ALL
SELECT b.id, 'CPE210',          'cpe210',          'http',    80,   TRUE FROM router_brands b WHERE b.slug = 'tp-link' UNION ALL
SELECT b.id, 'CPE510',          'cpe510',          'http',    80,   TRUE FROM router_brands b WHERE b.slug = 'tp-link' UNION ALL
SELECT b.id, 'CPE710',          'cpe710',          'http',    80,   TRUE FROM router_brands b WHERE b.slug = 'tp-link' UNION ALL
SELECT b.id, 'Archer C6',       'archer-c6',       'http',    80,   TRUE FROM router_brands b WHERE b.slug = 'tp-link' UNION ALL
SELECT b.id, 'Archer AX50',     'archer-ax50',     'http',    80,   TRUE FROM router_brands b WHERE b.slug = 'tp-link' UNION ALL
SELECT b.id, 'TL-WA850RE',      'tl-wa850re',      'http',    80,   TRUE FROM router_brands b WHERE b.slug = 'tp-link' UNION ALL
SELECT b.id, 'Deco M5',         'deco-m5',         'http',    80,   TRUE FROM router_brands b WHERE b.slug = 'tp-link'
ON CONFLICT (brand_id, slug) DO NOTHING;

-- Ubiquiti : modèles
INSERT INTO router_models (brand_id, name, slug, connection_type, default_port, is_active)
SELECT b.id, 'UniFi AP AC Lite',      'uap-ac-lite',      'http',  8443, TRUE FROM router_brands b WHERE b.slug = 'ubiquiti' UNION ALL
SELECT b.id, 'UniFi AP AC Pro',        'uap-ac-pro',        'http',  8443, TRUE FROM router_brands b WHERE b.slug = 'ubiquiti' UNION ALL
SELECT b.id, 'UniFi 6 Lite',           'u6-lite',           'http',  8443, TRUE FROM router_brands b WHERE b.slug = 'ubiquiti' UNION ALL
SELECT b.id, 'UniFi 6 Pro',            'u6-pro',            'http',  8443, TRUE FROM router_brands b WHERE b.slug = 'ubiquiti' UNION ALL
SELECT b.id, 'NanoStation M5',         'nanostation-m5',    'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'ubiquiti' UNION ALL
SELECT b.id, 'NanoStation Loco M5',    'nanostation-loco',  'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'ubiquiti' UNION ALL
SELECT b.id, 'AirMax AC M5',           'airmax-ac-m5',      'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'ubiquiti' UNION ALL
SELECT b.id, 'LiteBeam AC',            'litebeam-ac',       'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'ubiquiti' UNION ALL
SELECT b.id, 'UniFi Dream Machine',    'udm',               'http',  443,  TRUE FROM router_brands b WHERE b.slug = 'ubiquiti' UNION ALL
SELECT b.id, 'EdgeRouter X',           'edgerouter-x',      'ssh',   22,   TRUE FROM router_brands b WHERE b.slug = 'ubiquiti'
ON CONFLICT (brand_id, slug) DO NOTHING;

-- Huawei : modèles
INSERT INTO router_models (brand_id, name, slug, connection_type, default_port, is_active)
SELECT b.id, 'B311',   'b311',    'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'huawei' UNION ALL
SELECT b.id, 'B525',   'b525',    'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'huawei' UNION ALL
SELECT b.id, 'B535',   'b535',    'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'huawei' UNION ALL
SELECT b.id, 'B618',   'b618',    'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'huawei' UNION ALL
SELECT b.id, 'B818',   'b818',    'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'huawei' UNION ALL
SELECT b.id, 'E5577',  'e5577',   'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'huawei' UNION ALL
SELECT b.id, 'E5785',  'e5785',   'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'huawei' UNION ALL
SELECT b.id, 'E8372',  'e8372',   'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'huawei'
ON CONFLICT (brand_id, slug) DO NOTHING;

-- Tenda : modèles
INSERT INTO router_models (brand_id, name, slug, connection_type, default_port, is_active)
SELECT b.id, 'N301',    'n301',     'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'tenda' UNION ALL
SELECT b.id, 'F3',      'f3',       'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'tenda' UNION ALL
SELECT b.id, 'AC8',     'ac8',      'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'tenda' UNION ALL
SELECT b.id, 'AC10',    'ac10',     'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'tenda' UNION ALL
SELECT b.id, 'AC1200',  'ac1200',   'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'tenda' UNION ALL
SELECT b.id, 'MW6',     'mw6',      'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'tenda' UNION ALL
SELECT b.id, 'O3',      'o3',       'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'tenda'
ON CONFLICT (brand_id, slug) DO NOTHING;

-- ZTE : modèles
INSERT INTO router_models (brand_id, name, slug, connection_type, default_port, is_active)
SELECT b.id, 'MF283',    'mf283',    'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'zte' UNION ALL
SELECT b.id, 'MF286',    'mf286',    'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'zte' UNION ALL
SELECT b.id, 'MF287',    'mf287',    'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'zte' UNION ALL
SELECT b.id, 'MF289',    'mf289',    'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'zte' UNION ALL
SELECT b.id, 'MC801A',   'mc801a',   'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'zte'
ON CONFLICT (brand_id, slug) DO NOTHING;

-- Cisco : modèles
INSERT INTO router_models (brand_id, name, slug, connection_type, default_port, is_active)
SELECT b.id, 'Cisco 800 Series',   'c800',       'ssh',   22,   TRUE FROM router_brands b WHERE b.slug = 'cisco' UNION ALL
SELECT b.id, 'Cisco ISR 4000',     'isr4000',    'ssh',   22,   TRUE FROM router_brands b WHERE b.slug = 'cisco' UNION ALL
SELECT b.id, 'Cisco Meraki MR36',  'meraki-mr36','api',   443,  TRUE FROM router_brands b WHERE b.slug = 'cisco' UNION ALL
SELECT b.id, 'Cisco Meraki MR84',  'meraki-mr84','api',   443,  TRUE FROM router_brands b WHERE b.slug = 'cisco'
ON CONFLICT (brand_id, slug) DO NOTHING;

-- D-Link : modèles
INSERT INTO router_models (brand_id, name, slug, connection_type, default_port, is_active)
SELECT b.id, 'DIR-615',   'dir-615',   'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'd-link' UNION ALL
SELECT b.id, 'DIR-825',   'dir-825',   'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'd-link' UNION ALL
SELECT b.id, 'DIR-842',   'dir-842',   'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'd-link' UNION ALL
SELECT b.id, 'DIR-882',   'dir-882',   'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'd-link' UNION ALL
SELECT b.id, 'DAP-1650',  'dap-1650',  'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'd-link' UNION ALL
SELECT b.id, 'COVR-1200', 'covr-1200', 'http',  80,   TRUE FROM router_brands b WHERE b.slug = 'd-link'
ON CONFLICT (brand_id, slug) DO NOTHING;
