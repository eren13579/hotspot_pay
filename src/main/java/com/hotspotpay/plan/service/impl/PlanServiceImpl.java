package com.hotspotpay.plan.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.hotspot.model.Hotspot;
import com.hotspotpay.hotspot.repository.HotspotRepository;
import com.hotspotpay.plan.dto.CreatePlanRequest;
import com.hotspotpay.plan.dto.PlanResponse;
import com.hotspotpay.plan.dto.UpdatePlanRequest;
import com.hotspotpay.plan.model.Plan;
import com.hotspotpay.plan.repository.PlanRepository;
import com.hotspotpay.plan.service.PlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlanServiceImpl implements PlanService {

    private final PlanRepository planRepository;
    private final HotspotRepository hotspotRepository;

    @Override
    @Transactional
    public PlanResponse create(String userId, String hotspotId, CreatePlanRequest request) {
        // Vérifie que le hotspot appartient bien à cet utilisateur
        Hotspot hotspot = getOwnedHotspot(userId, hotspotId);

        // Vérifie doublon de nom sur ce hotspot
        if (planRepository.existsByNameAndHotspotId(request.getName(), hotspotId)) {
            throw AppException.conflict(
                    "Un forfait avec le nom \"" + request.getName() + "\" existe déjà sur ce hotspot"
            );
        }

        Plan plan = Plan.builder()
                .planId(UUID.randomUUID().toString())
                .hotspotId(hotspot.getHotspotId())
                .name(request.getName())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .currency(request.getCurrency() != null ? request.getCurrency() : "XAF")
                .downloadSpeedKbps(request.getDownloadSpeedKbps())
                .uploadSpeedKbps(request.getUploadSpeedKbps())
                .dataLimitMb(request.getDataLimitMb())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .isActive(true)
                .build();

        planRepository.save(plan);
        log.info("Plan created: planId={}, hotspotId={}, name={}",
                plan.getPlanId(), hotspotId, plan.getName());

        return toResponse(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlanResponse> findAll(String userId, String hotspotId) {
        getOwnedHotspot(userId, hotspotId); // vérifie ownership
        return planRepository
                .findAllByHotspotIdOrderByDisplayOrderAscCreatedAtAsc(hotspotId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlanResponse> findActive(String hotspotId) {
        // Route publique pour le portail captif — pas de vérif ownership
        return planRepository
                .findAllByHotspotIdAndIsActiveTrueOrderByDisplayOrderAscPriceAsc(hotspotId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PlanResponse findById(String userId, String hotspotId, String planId) {
        getOwnedHotspot(userId, hotspotId);
        return toResponse(getOwnedPlan(hotspotId, planId));
    }

    @Override
    @Transactional
    public PlanResponse update(String userId, String hotspotId,
                               String planId, UpdatePlanRequest request) {
        getOwnedHotspot(userId, hotspotId);
        Plan plan = getOwnedPlan(hotspotId, planId);

        if (request.getName() != null) {
            // Vérif doublon uniquement si le nom change
            if (!request.getName().equals(plan.getName()) &&
                    planRepository.existsByNameAndHotspotId(request.getName(), hotspotId)) {
                throw AppException.conflict(
                        "Un forfait avec le nom \"" + request.getName() + "\" existe déjà"
                );
            }
            plan.setName(request.getName());
        }
        if (request.getDescription()     != null) plan.setDescription(request.getDescription());
        if (request.getDurationMinutes() != null) plan.setDurationMinutes(request.getDurationMinutes());
        if (request.getPrice()           != null) plan.setPrice(request.getPrice());
        if (request.getCurrency()        != null) plan.setCurrency(request.getCurrency());
        if (request.getDownloadSpeedKbps()!= null) plan.setDownloadSpeedKbps(request.getDownloadSpeedKbps());
        if (request.getUploadSpeedKbps() != null) plan.setUploadSpeedKbps(request.getUploadSpeedKbps());
        if (request.getDataLimitMb()     != null) plan.setDataLimitMb(request.getDataLimitMb());
        if (request.getDisplayOrder()    != null) plan.setDisplayOrder(request.getDisplayOrder());

        planRepository.save(plan);
        log.info("Plan updated: planId={}", planId);
        return toResponse(plan);
    }

    @Override
    @Transactional
    public void toggleActive(String userId, String hotspotId, String planId) {
        getOwnedHotspot(userId, hotspotId);
        Plan plan = getOwnedPlan(hotspotId, planId);
        boolean newStatus = !plan.getIsActive();
        planRepository.updateActiveStatus(planId, newStatus);
        log.info("Plan toggled: planId={}, isActive={}", planId, newStatus);
    }

    @Override
    @Transactional
    public void delete(String userId, String hotspotId, String planId) {
        getOwnedHotspot(userId, hotspotId);
        Plan plan = getOwnedPlan(hotspotId, planId);
        planRepository.delete(plan);
        log.info("Plan deleted: planId={}", planId);
    }

    // ── Privé ──────────────────────────────────────────────────────────────

    private Hotspot getOwnedHotspot(String userId, String hotspotId) {
        return hotspotRepository.findByHotspotIdAndUserId(hotspotId, userId)
                .orElseThrow(() -> AppException.notFound(
                        "Hotspot introuvable ou accès non autorisé"
                ));
    }

    private Plan getOwnedPlan(String hotspotId, String planId) {
        return planRepository.findByPlanIdAndHotspotId(planId, hotspotId)
                .orElseThrow(() -> AppException.notFound(
                        "Forfait introuvable sur ce hotspot"
                ));
    }

    private PlanResponse toResponse(Plan p) {
        return PlanResponse.builder()
                .planId(p.getPlanId())
                .hotspotId(p.getHotspotId())
                .name(p.getName())
                .description(p.getDescription())
                .durationMinutes(p.getDurationMinutes())
                .durationLabel(formatDuration(p.getDurationMinutes()))
                .price(p.getPrice())
                .currency(p.getCurrency())
                .priceLabel(p.getPrice().toPlainString() + " " + p.getCurrency())
                .downloadSpeedKbps(p.getDownloadSpeedKbps())
                .uploadSpeedKbps(p.getUploadSpeedKbps())
                .dataLimitMb(p.getDataLimitMb())
                .dataLimitLabel(p.getDataLimitMb() == null
                        ? "Illimité"
                        : formatDataLimit(p.getDataLimitMb()))
                .displayOrder(p.getDisplayOrder())
                .isActive(p.getIsActive())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    /**
     * Convertit les minutes en label lisible.
     * 30 → "30 min" | 60 → "1h" | 1440 → "24h" | 10080 → "7 jours"
     */
    private String formatDuration(int minutes) {
        if (minutes < 60)   return minutes + " min";
        if (minutes < 1440) return (minutes / 60) + "h";
        if (minutes < 10080) return (minutes / 1440) + " jour(s)";
        return (minutes / 10080) + " semaine(s)";
    }

    /**
     * Convertit les MB en label lisible.
     * 512 → "512 MB" | 1024 → "1 GB" | 10240 → "10 GB"
     */
    private String formatDataLimit(int mb) {
        if (mb < 1024) return mb + " MB";
        return (mb / 1024) + " GB";
    }
}