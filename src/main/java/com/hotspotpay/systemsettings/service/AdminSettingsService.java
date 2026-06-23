package com.hotspotpay.systemsettings.service;

import com.hotspotpay.audit.service.AuditService;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.realtime.service.SystemSseService;
import com.hotspotpay.systemsettings.dto.SectionResponse;
import com.hotspotpay.systemsettings.dto.SettingItemResponse;
import com.hotspotpay.systemsettings.dto.SettingItemUpdateRequest;
import com.hotspotpay.systemsettings.dto.SystemSettingsResponse;
import com.hotspotpay.systemsettings.dto.SystemSettingsUpdateRequest;
import com.hotspotpay.systemsettings.model.SystemSetting;
import com.hotspotpay.systemsettings.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminSettingsService {

    private static final String MASK = "********";

    private final SystemSettingRepository repository;
    private final AuditService auditService;
    private final SystemSseService systemSseService;

    @Transactional(readOnly = true)
    public SystemSettingsResponse getSettings() {
        ensureDefaults();

        List<SystemSetting> settings = repository.findAllByOrderBySectionKeyAscSettingKeyAsc();
        Map<String, List<SettingItemResponse>> grouped = new LinkedHashMap<>();
        LocalDateTime updatedAt = null;

        for (SystemSetting setting : settings) {
            grouped.computeIfAbsent(setting.getSectionKey(), ignored -> new ArrayList<>())
                    .add(toResponse(setting));
            updatedAt = max(updatedAt, setting.getUpdatedAt());
        }

        List<SectionResponse> sections = grouped.entrySet().stream()
                .map(entry -> SectionResponse.builder()
                        .key(entry.getKey())
                        .label(labelForSection(entry.getKey()))
                        .items(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        return SystemSettingsResponse.builder()
                .updatedAt(updatedAt)
                .sections(sections)
                .build();
    }

    @Transactional
    public SystemSettingsResponse updateSettings(SystemSettingsUpdateRequest request) {
        ensureDefaults();

        List<SystemSetting> existingSettings = repository.findAllByOrderBySectionKeyAscSettingKeyAsc();
        Map<String, SystemSetting> byKey = existingSettings.stream()
                .collect(Collectors.toMap(SystemSetting::getSettingKey, setting -> setting, (a, b) -> a));

        Set<String> seenKeys = new HashSet<>();
        List<String> changedKeys = new ArrayList<>();

        for (SettingItemUpdateRequest item : request.getSettings()) {
            String key = item.getKey();

            if (!seenKeys.add(key)) {
                throw AppException.badRequest("Paramètre dupliqué : " + key);
            }

            SystemSetting setting = byKey.get(key);
            if (setting == null) {
                throw AppException.badRequest("Paramètre inconnu : " + key);
            }
            if (!Boolean.TRUE.equals(setting.getIsEditable())) {
                throw AppException.badRequest("Ce paramètre ne peut pas être modifié depuis l'interface : " + key);
            }

            if (Boolean.TRUE.equals(setting.getIsSecret())) {
                if (isBlank(item.getValue()) || MASK.equals(item.getValue())) {
                    continue;
                }
            }

            String oldValue = setting.getValue();
            setting.setValue(item.getValue() == null ? "" : item.getValue());
            repository.save(setting);

            changedKeys.add(key);
            log.info("System setting updated: key={}, secret={}, userId={}",
                    key, setting.getIsSecret(), currentUserId());

            auditService.log(
                    currentUserId(),
                    null,
                    "UPDATE_SYSTEM_SETTINGS",
                    "SystemSetting",
                    key,
                    null,
                    null,
                    "oldValue=" + maskForAudit(oldValue, setting.getIsSecret())
                            + "; newValue=" + maskForAudit(setting.getValue(), setting.getIsSecret())
            );
        }

        if (changedKeys.isEmpty()) {
            log.info("System settings save requested without secret replacement: userId={}", currentUserId());
        } else {
            systemSseService.broadcast("settings_updated", changedKeys);
        }

        return getSettings();
    }

    private void ensureDefaults() {
        if (!repository.findAll().isEmpty()) {
            return;
        }

        Map<String, DefaultSetting> defaults = defaultSettings();
        for (DefaultSetting setting : defaults.values()) {
            repository.save(SystemSetting.builder()
                    .settingKey(setting.key)
                    .sectionKey(setting.sectionKey)
                    .sectionLabel(labelForSection(setting.sectionKey))
                    .label(setting.label)
                    .description(setting.description)
                    .valueType(setting.valueType)
                    .value(setting.value)
                    .isSecret(setting.secret)
                    .isEditable(true)
                    .build());
        }
    }

    private SettingItemResponse toResponse(SystemSetting setting) {
        String value = setting.getValue();
        if (Boolean.TRUE.equals(setting.getIsSecret()) && !isBlank(value)) {
            value = MASK;
        }

        return SettingItemResponse.builder()
                .key(setting.getSettingKey())
                .sectionKey(setting.getSectionKey())
                .sectionLabel(setting.getSectionLabel())
                .label(setting.getLabel())
                .description(setting.getDescription())
                .type(setting.getValueType())
                .value(value)
                .secret(setting.getIsSecret())
                .editable(setting.getIsEditable())
                .build();
    }

    private String currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof String ? (String) principal : null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private LocalDateTime max(LocalDateTime a, LocalDateTime b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }

    private String maskForAudit(String value, boolean secret) {
        if (!secret || isBlank(value)) return value;
        return MASK;
    }

    private String labelForSection(String key) {
        return switch (key) {
            case "general" -> "Général";
            case "branding" -> "Marque et présentation";
            case "about" -> "À propos";
            case "payments" -> "Paiements";
            case "fastapi" -> "FastAPI et routeurs";
            case "portal" -> "Portail captif";
            case "security" -> "Sécurité";
            case "notifications" -> "Notifications";
            case "withdrawals" -> "Retraits";
            default -> key;
        };
    }

    private Map<String, DefaultSetting> defaultSettings() {
        Map<String, DefaultSetting> settings = new LinkedHashMap<>();

        add(settings, "app.name", "general", "Nom de l'application", "Nom affiché dans l'interface et les emails.", "text", "HotspotPay", false);
        add(settings, "app.supportEmail", "general", "Email support", "Email affiché pour le support client.", "email", "support@hotspotpay.cm", false);
        add(settings, "app.maintenanceMode", "general", "Mode maintenance", "Active ou désactive l'accès public à l'application.", "switch", "false", false);
        add(settings, "app.registrationEnabled", "general", "Inscriptions activées", "Autorise ou bloque les nouvelles inscriptions.", "switch", "true", false);

        add(settings, "branding.logoUrl", "branding", "URL du logo", "URL publique ou chemin du logo de l'application.", "url", "", false);
        add(settings, "branding.primaryColor", "branding", "Couleur principale", "Couleur principale utilisée dans le branding.", "text", "#2563EB", false);
        add(settings, "branding.faviconUrl", "branding", "URL du favicon", "URL publique ou chemin du favicon.", "url", "", false);

        add(settings, "about.enabled", "about", "Section À propos activée", "Affiche ou masque la section À propos sur les pages publiques.", "switch", "true", false);
        add(settings, "about.title", "about", "Titre À propos", "Titre principal de la section À propos.", "text", "Gérez vos hotspots et paiements simplement", false);
        add(settings, "about.subtitle", "about", "Sous-titre À propos", "Phrase courte affichée sous le titre.", "text", "HotspotPay centralise les ventes WiFi, les sessions et les retraits.", false);
        add(settings, "about.description", "about", "Description À propos", "Texte détaillé de présentation de HotspotPay.", "text", "HotspotPay aide les gérants de hotspots WiFi à vendre des accès internet, suivre les paiements mobile money et gérer les sessions clients depuis un tableau de bord clair.", false);
        add(settings, "about.photoUrls", "about", "Photos À propos", "Liste JSON des URLs ou chemins des photos affichées dans la section À propos.", "json", "[\"/about/hotspot-1.jpg\",\"/about/hotspot-2.jpg\",\"/about/hotspot-3.jpg\"]", false);

        add(settings, "payments.campay.enabled", "payments", "Campay activé", "Active ou désactive Campay comme fournisseur de paiement.", "switch", "true", false);
        add(settings, "payments.campay.baseUrl", "payments", "Campay base URL", "URL de l'API Campay.", "url", "https://demo.campay.net", false);
        add(settings, "payments.campay.username", "payments", "Campay username", "Identifiant Campay.", "text", "", false);
        add(settings, "payments.campay.password", "payments", "Campay password", "Mot de passe Campay. Laisser vide pour conserver.", "password", "", true);
        add(settings, "payments.moneroo.enabled", "payments", "Moneroo activé", "Active ou désactive Moneroo comme fournisseur de paiement.", "switch", "false", false);
        add(settings, "payments.moneroo.baseUrl", "payments", "Moneroo base URL", "URL de l'API Moneroo.", "url", "https://api.moneroo.io", false);
        add(settings, "payments.moneroo.apiKey", "payments", "Moneroo API key", "Clé API Moneroo. Laisser vide pour conserver.", "password", "", true);
        add(settings, "payments.moneroo.currency", "payments", "Devise Moneroo", "Devise utilisée pour Moneroo.", "text", "XAF", false);
        add(settings, "payments.moneroo.methods", "payments", "Méthodes Moneroo", "Méthodes de paiement séparées par une virgule.", "text", "mtn_cm,orange_cm", false);

        add(settings, "fastapi.baseUrl", "fastapi", "FastAPI base URL", "URL du microservice FastAPI utilisé par les routeurs.", "url", "http://localhost:8444", false);
        add(settings, "fastapi.apiKey", "fastapi", "FastAPI API key", "Clé API FastAPI. Laisser vide pour conserver.", "password", "", true);
        add(settings, "fastapi.callbackSecret", "fastapi", "FastAPI callback secret", "Secret de callback FastAPI. Laisser vide pour conserver.", "password", "", true);
        add(settings, "fastapi.pollingEnabled", "fastapi", "Polling routeurs activé", "Active le polling automatique vers le service routeurs.", "switch", "true", false);

        add(settings, "portal.pollingIntervalSeconds", "portal", "Intervalle polling portail", "Nombre de secondes entre deux vérifications de paiement.", "number", "5", false);
        add(settings, "portal.pollingMaxAttempts", "portal", "Tentatives max polling", "Nombre maximum de tentatives avant échec.", "number", "36", false);
        add(settings, "portal.sessionActivationRetry", "portal", "Retours activation session", "Nombre de tentatives d'activation de session.", "number", "3", false);

        add(settings, "security.corsAllowedOrigins", "security", "Origines CORS", "Origines autorisées, séparées par une virgule.", "text", "*", false);
        add(settings, "security.webhookAllowedIps", "security", "IP webhooks autorisées", "IP autorisées pour les webhooks, séparées par une virgule.", "text", "*", false);
        add(settings, "security.routerCallbackAllowedIps", "security", "IP callbacks routeurs", "IP autorisées pour les callbacks routeurs, séparées par une virgule.", "text", "*", false);
        add(settings, "security.rateLimitPortalPerMinute", "security", "Rate limit portail", "Nombre max de requêtes portail par minute.", "number", "100", false);
        add(settings, "security.rateLimitAuthPerMinute", "security", "Rate limit auth", "Nombre max de requêtes auth par minute.", "number", "100", false);
        add(settings, "security.rateLimitWebhookPerMinute", "security", "Rate limit webhooks", "Nombre max de requêtes webhooks par minute.", "number", "100", false);

        add(settings, "notifications.mailEnabled", "notifications", "Emails activés", "Active ou désactive l'envoi d'emails.", "switch", "false", false);
        add(settings, "notifications.mailHost", "notifications", "SMTP host", "Hôte SMTP.", "text", "smtp.hostinger.com", false);
        add(settings, "notifications.mailPort", "notifications", "SMTP port", "Port SMTP.", "number", "587", false);
        add(settings, "notifications.mailUsername", "notifications", "SMTP username", "Identifiant SMTP.", "text", "", false);
        add(settings, "notifications.mailPassword", "notifications", "SMTP password", "Mot de passe SMTP. Laisser vide pour conserver.", "password", "", true);
        add(settings, "notifications.mailFrom", "notifications", "Email expéditeur", "Email utilisé comme expéditeur.", "email", "no-reply@hotspotpay.cm", false);

        add(settings, "withdrawals.enabled", "withdrawals", "Retraits activés", "Active ou désactive les demandes de retrait.", "switch", "true", false);
        add(settings, "withdrawals.minAmount", "withdrawals", "Montant minimum", "Montant minimum d'un retrait en XAF.", "number", "1000", false);
        add(settings, "withdrawals.maxAmount", "withdrawals", "Montant maximum", "Montant maximum d'un retrait en XAF.", "number", "500000", false);
        add(settings, "withdrawals.feeFixed", "withdrawals", "Frais fixes", "Frais fixes appliqués à chaque retrait en XAF.", "number", "0", false);
        add(settings, "withdrawals.feePercentage", "withdrawals", "Frais en %", "Pourcentage de frais sur le montant du retrait.", "number", "1.5", false);
        add(settings, "withdrawals.methods", "withdrawals", "Méthodes disponibles", "Méthodes de retrait séparées par une virgule (orange,mtn,airtel).", "text", "orange,mtn", false);

        return settings;
    }

    private void add(Map<String, DefaultSetting> settings,
                     String key,
                     String sectionKey,
                     String label,
                     String description,
                     String valueType,
                     String value,
                     boolean secret) {
        settings.put(key, new DefaultSetting(key, sectionKey, label, description, valueType, value, secret));
    }

    private static class DefaultSetting {
        private final String key;
        private final String sectionKey;
        private final String label;
        private final String description;
        private final String valueType;
        private final String value;
        private final boolean secret;

        private DefaultSetting(String key, String sectionKey, String label, String description,
                               String valueType, String value, boolean secret) {
            this.key = key;
            this.sectionKey = sectionKey;
            this.label = label;
            this.description = description;
            this.valueType = valueType;
            this.value = value;
            this.secret = secret;
        }
    }
}
