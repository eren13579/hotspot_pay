package com.hotspotpay.router.service.impl;

import com.hotspotpay.router.dto.RouterModelRequest;
import com.hotspotpay.router.dto.RouterModelResponse;
import com.hotspotpay.router.model.RouterBrand;
import com.hotspotpay.router.model.RouterModel;
import com.hotspotpay.router.repository.RouterModelRepository;
import com.hotspotpay.router.service.RouterBrandService;
import com.hotspotpay.router.service.RouterModelService;
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
public class RouterModelServiceImpl implements RouterModelService {

    private final RouterModelRepository modelRepository;
    private final RouterBrandService brandService;

    @Override
    @Transactional(readOnly = true)
    public List<RouterModelResponse> findByBrand(UUID brandId) {
        return modelRepository.findByBrandIdAndIsActiveTrueOrderByNameAsc(brandId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RouterModelResponse> findActiveByBrand(UUID brandId) {
        return findByBrand(brandId);
    }

    @Override
    @Transactional(readOnly = true)
    public RouterModelResponse findById(UUID id) {
        RouterModel model = modelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Modele non trouve : " + id));
        return toResponse(model);
    }

    @Override
    @Transactional
    public RouterModelResponse create(RouterModelRequest request) {
        RouterBrand brand = brandService.findById(request.getBrandId());

        if (modelRepository.existsByBrandIdAndSlug(request.getBrandId(), request.getSlug())) {
            throw new RuntimeException("Modele deja existant : " + request.getSlug());
        }

        RouterModel model = RouterModel.builder()
                .brand(brand)
                .name(request.getName())
                .slug(request.getSlug())
                .connectionType(request.getConnectionType() != null ? request.getConnectionType() : "api")
                .defaultPort(request.getDefaultPort())
                .configSchema(request.getConfigSchema())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        RouterModel saved = modelRepository.save(model);
        log.info("Modele de routeur cree : {} ({})", saved.getName(), saved.getSlug());
        return toResponse(saved);
    }

    private RouterBrand resolveBrand(UUID brandId) {
        return brandService.findById(brandId);
    }

    @Override
    @Transactional
    public RouterModelResponse update(UUID id, RouterModelRequest request) {
        RouterModel model = modelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Modele non trouve : " + id));

        model.setName(request.getName());
        model.setConnectionType(request.getConnectionType() != null ? request.getConnectionType() : model.getConnectionType());
        model.setDefaultPort(request.getDefaultPort());
        model.setConfigSchema(request.getConfigSchema());
        model.setIsActive(request.getIsActive() != null ? request.getIsActive() : model.getIsActive());

        if (request.getSlug() != null && !request.getSlug().equals(model.getSlug())) {
            if (modelRepository.existsByBrandIdAndSlug(model.getBrand().getId(), request.getSlug())) {
                throw new RuntimeException("Slug deja utilise : " + request.getSlug());
            }
            model.setSlug(request.getSlug());
        }

        RouterModel updated = modelRepository.save(model);
        log.info("Modele de routeur mis a jour : {}", updated.getName());
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void toggleActive(UUID id) {
        RouterModel model = modelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Modele non trouve : " + id));
        model.setIsActive(!model.getIsActive());
        modelRepository.save(model);
        log.info("Modele {} : {}", model.getName(), model.getIsActive() ? "active" : "desactive");
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        RouterModel model = modelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Modele non trouve : " + id));
        modelRepository.delete(model);
        log.info("Modele de routeur supprime : {}", model.getName());
    }

    private RouterModelResponse toResponse(RouterModel model) {
        return RouterModelResponse.builder()
                .id(model.getId())
                .brandId(model.getBrand().getId())
                .brandName(model.getBrand().getName())
                .name(model.getName())
                .slug(model.getSlug())
                .connectionType(model.getConnectionType())
                .defaultPort(model.getDefaultPort())
                .configSchema(model.getConfigSchema())
                .isActive(model.getIsActive())
                .createdAt(model.getCreatedAt())
                .build();
    }
}
