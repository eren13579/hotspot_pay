package com.hotspotpay.router.service.impl;

import com.hotspotpay.router.dto.RouterBrandRequest;
import com.hotspotpay.router.dto.RouterBrandResponse;
import com.hotspotpay.router.model.RouterBrand;
import com.hotspotpay.router.repository.RouterBrandRepository;
import com.hotspotpay.router.repository.RouterModelRepository;
import com.hotspotpay.router.service.RouterBrandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RouterBrandServiceImpl implements RouterBrandService {

    private final RouterBrandRepository brandRepository;
    private final RouterModelRepository modelRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RouterBrandResponse> findAll(boolean onlyActive) {
        List<RouterBrand> brands = onlyActive
                ? brandRepository.findByIsActiveTrueOrderByNameAsc()
                : brandRepository.findAll();

        return brands.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RouterBrand findById(UUID id) {
        return brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Marque non trouvee : " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public RouterBrandResponse findBySlug(String slug) {
        RouterBrand brand = brandRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Marque de routeur non trouvée : " + slug));
        return toResponse(brand);
    }

    @Override
    @Transactional
    public RouterBrandResponse create(RouterBrandRequest request) {
        if (brandRepository.existsBySlug(request.getSlug())) {
            throw new RuntimeException("Une marque avec ce slug existe déjà : " + request.getSlug());
        }

        RouterBrand brand = RouterBrand.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .description(request.getDescription())
                .logoUrl(request.getLogoUrl())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        RouterBrand saved = brandRepository.save(brand);
        log.info("Marque de routeur créée : {} ({})", saved.getName(), saved.getSlug());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public RouterBrandResponse update(String slug, RouterBrandRequest request) {
        RouterBrand brand = brandRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Marque de routeur non trouvée : " + slug));

        brand.setName(request.getName());
        brand.setDescription(request.getDescription());
        brand.setLogoUrl(request.getLogoUrl());
        brand.setIsActive(request.getIsActive() != null ? request.getIsActive() : brand.getIsActive());

        if (request.getSlug() != null && !request.getSlug().equals(slug)) {
            if (brandRepository.existsBySlug(request.getSlug())) {
                throw new RuntimeException("Slug déjà utilisé : " + request.getSlug());
            }
            brand.setSlug(request.getSlug());
        }

        RouterBrand updated = brandRepository.save(brand);
        log.info("Marque de routeur mise à jour : {} ({})", updated.getName(), updated.getSlug());
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void toggleActive(String slug) {
        RouterBrand brand = brandRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Marqe de routeur non trouvée : " + slug));
        brand.setIsActive(!brand.getIsActive());
        brandRepository.save(brand);
        log.info("Marque {} : {}", brand.getName(), brand.getIsActive() ? "activée" : "désactivée");
    }

    @Override
    @Transactional
    public void delete(String slug) {
        RouterBrand brand = brandRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Marque non trouvée : " + slug));
        long modelCount = modelRepository.countByBrandId(brand.getId());
        if (modelCount > 0) {
            throw new RuntimeException("Impossible de supprimer : " + modelCount + " modèle(s) lié(s). Supprimez d'abord les modèles.");
        }
        brandRepository.delete(brand);
        log.info("Marque de routeur supprimée : {} ({})", brand.getName(), slug);
    }

    private RouterBrandResponse toResponse(RouterBrand brand) {
        return RouterBrandResponse.builder()
                .id(brand.getId())
                .name(brand.getName())
                .slug(brand.getSlug())
                .description(brand.getDescription())
                .logoUrl(brand.getLogoUrl())
                .isActive(brand.getIsActive())
                .modelCount(modelRepository.countByBrandId(brand.getId()))
                .createdAt(brand.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RouterBrand getBrandOrThrow(String slug) {
        return brandRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Marque non trouvee : " + slug));
    }
}
