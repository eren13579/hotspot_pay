package com.hotspotpay.publicapi.service;

import com.hotspotpay.publicapi.dto.PublicSettingsResponse;
import com.hotspotpay.systemsettings.model.SystemSetting;
import com.hotspotpay.systemsettings.repository.SystemSettingRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicSettingsService {

    private final SystemSettingRepository repository;
    private final ObjectMapper objectMapper;

    private static final List<String> PUBLIC_SECTIONS = List.of("general", "branding", "about", "support");

    public PublicSettingsResponse getSettings() {
        List<SystemSetting> all = repository.findAllByOrderBySectionKeyAscSettingKeyAsc();
        Map<String, String> map = all.stream()
                .filter(s -> PUBLIC_SECTIONS.contains(s.getSectionKey()))
                .collect(Collectors.toMap(SystemSetting::getSettingKey, s -> s.getValue() != null ? s.getValue() : "", (a, b) -> a));

        return PublicSettingsResponse.builder()
                .logoUrl(map.getOrDefault("branding.logoUrl", ""))
                .primaryColor(map.getOrDefault("branding.primaryColor", "#2563EB"))
                .faviconUrl(map.getOrDefault("branding.faviconUrl", ""))
                .appName(map.getOrDefault("app.name", "HotspotPay"))
                .supportEmail(map.getOrDefault("app.supportEmail", "support@hotspotpay.cm"))
                .maintenanceMode("true".equals(map.getOrDefault("app.maintenanceMode", "false")))
                .registrationEnabled("true".equals(map.getOrDefault("app.registrationEnabled", "true")))
                .aboutEnabled("true".equals(map.getOrDefault("about.enabled", "true")))
                .aboutTitle(map.getOrDefault("about.title", ""))
                .aboutSubtitle(map.getOrDefault("about.subtitle", ""))
                .aboutDescription(map.getOrDefault("about.description", ""))
                .aboutPhotos(parsePhotoUrls(map.getOrDefault("about.photoUrls", "[]")))
                .whatsappNumber(map.getOrDefault("support.whatsappNumber", "+237 6XX XXX XXX"))
                .docsEnabled("true".equals(map.getOrDefault("support.docsEnabled", "true")))
                .docsUrl(map.getOrDefault("support.docsUrl", "/docs"))
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private List<String> parsePhotoUrls(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse about.photoUrls: {}", json, e);
            return Collections.emptyList();
        }
    }
}
