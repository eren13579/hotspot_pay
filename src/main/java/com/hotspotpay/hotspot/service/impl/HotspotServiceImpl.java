package com.hotspotpay.hotspot.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.hotspot.dto.CreateHotspotRequest;
import com.hotspotpay.hotspot.dto.HotspotResponse;
import com.hotspotpay.hotspot.dto.HotspotStatusResponse;
import com.hotspotpay.hotspot.dto.UpdateHotspotRequest;
import com.hotspotpay.hotspot.mikrotik.MikroTikClient;
import com.hotspotpay.hotspot.mikrotik.utils.MikroTikCredentialUtil;
import com.hotspotpay.hotspot.model.Hotspot;
import com.hotspotpay.hotspot.repository.HotspotRepository;
import com.hotspotpay.hotspot.service.HotspotService;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class HotspotServiceImpl implements HotspotService {

    private final HotspotRepository hotspotRepository;
    private final MikroTikClient mikroTikClient;
    private final MikroTikCredentialUtil mikroTikCredentialUtil;

    @Override
    @Transactional
    public HotspotResponse create(String userId, CreateHotspotRequest request) {
        if (hotspotRepository.existsByMikrotikIpAndUserId(request.getMikrotikIp(), userId)) {
            throw AppException.conflict(
                    "Un hotspot avec l'IP " + request.getMikrotikIp() + " existe déjà"
            );
        }

        String encryptedPassword = mikroTikCredentialUtil.encrypt(request.getMikrotikPassword());

        Hotspot newHotspot = Hotspot.builder()
                .hotspotId(UUID.randomUUID().toString())
                .userId(userId)
                .name(request.getName())
                .location(request.getLocation())
                .mikrotikIp(request.getMikrotikIp())
                .mikrotikPort(request.getMikrotikPort() != null ? request.getMikrotikPort() : 8728)
                .mikrotikUser(request.getMikrotikUser())
                .mikrotikPasswordEnc(encryptedPassword)
                .hotspotProfile(request.getHotspotProfile() != null ? request.getHotspotProfile() : "default")
                .isOnline(false)
                .build();
        hotspotRepository.save(newHotspot);

        boolean online = testAndUpdateStatus(newHotspot);
        log.info("Hotspot created: hotspotId={}, userId={}, online={}",
                newHotspot.getHotspotId(), userId, online);
        return toResponse(newHotspot);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<HotspotResponse> findAll(String userId, Pageable pageable) {
        return hotspotRepository.findAllByUserId(userId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public HotspotResponse findById(String userId, String hotspotId) {
        return toResponse(getOwnedHotspot(userId, hotspotId));
    }

    @Override
    @Transactional
    public HotspotResponse update(String userId, String hotspotId, UpdateHotspotRequest request) {
        Hotspot hotspot = getOwnedHotspot(userId, hotspotId);

        if (request.getName()          != null) hotspot.setName(request.getName());
        if (request.getLocation()      != null) hotspot.setLocation(request.getLocation());
        if (request.getMikrotikIp()    != null) hotspot.setMikrotikIp(request.getMikrotikIp());
        if (request.getMikrotikPort()  != null) hotspot.setMikrotikPort(request.getMikrotikPort());
        if (request.getMikrotikUser()  != null) hotspot.setMikrotikUser(request.getMikrotikUser());
        if (request.getHotspotProfile()!= null) hotspot.setHotspotProfile(request.getHotspotProfile());

        // Re-chiffre le mot de passe si fourni
        if (request.getMikrotikPassword() != null && !request.getMikrotikPassword().isBlank()) {
            hotspot.setMikrotikPasswordEnc(mikroTikCredentialUtil.encrypt(request.getMikrotikPassword()));
        }

        hotspotRepository.save(hotspot);
        log.info("Hotspot updated: hotspotId={}", hotspotId);
        return toResponse(hotspot);
    }

    @Override
    @Transactional
    public void delete(String userId, String hotspotId) {
        Hotspot hotspot = getOwnedHotspot(userId, hotspotId);
        hotspotRepository.delete(hotspot);
        log.info("Hotspot deleted: hotspotId={}", hotspotId);
    }

    @Override
    @Transactional
    public HotspotStatusResponse testConnection(String userId, String hotspotId) {
        Hotspot hotspot = getOwnedHotspot(userId, hotspotId);
        boolean online = testAndUpdateStatus(hotspot);

        return HotspotStatusResponse.builder()
                .hotspotId(hotspot.getHotspotId())
                .name(hotspot.getName())
                .isOnline(online)
                .lastPingAt(hotspot.getLastPingAt())
                .message(online
                        ? "Connexion MikroTik établie avec succès"
                        : "Impossible de joindre le routeur MikroTik")
                .build();
    }

    private Hotspot getOwnedHotspot(String userId, String hotspotId) {
        return hotspotRepository.findByHotspotIdAndUserId(hotspotId, userId)
                .orElseThrow(() -> AppException.notFound(
                        "Hotspot introuvable ou accès non autorisé"
                ));
    }

    private boolean testAndUpdateStatus(Hotspot hotspot) {
        String plainPassword = mikroTikCredentialUtil.decrypt(hotspot.getMikrotikPasswordEnc());
        boolean online = mikroTikClient.ping(hotspot, plainPassword);

        hotspot.setIsOnline(online);
        hotspot.setLastPingAt(LocalDateTime.now());
        hotspotRepository.save(hotspot);

        return online;
    }

    private HotspotResponse toResponse(Hotspot h) {
        return HotspotResponse.builder()
                .hotspotId(h.getHotspotId())
                .name(h.getName())
                .location(h.getLocation())
                .mikrotikIp(h.getMikrotikIp())
                .mikrotikPort(h.getMikrotikPort())
                .mikrotikUser(h.getMikrotikUser())
                .hotspotProfile(h.getHotspotProfile())
                .isOnline(h.getIsOnline())
                .lastPingAt(h.getLastPingAt())
                .createdAt(h.getCreatedAt())
                .updatedAt(h.getUpdatedAt())
                .build();
    }
}