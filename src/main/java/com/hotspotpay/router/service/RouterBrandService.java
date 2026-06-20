package com.hotspotpay.router.service;

import com.hotspotpay.router.dto.RouterBrandRequest;
import com.hotspotpay.router.dto.RouterBrandResponse;
import com.hotspotpay.router.model.RouterBrand;

import java.util.List;
import java.util.UUID;

public interface RouterBrandService {

    List<RouterBrandResponse> findAll(boolean onlyActive);

    RouterBrandResponse findBySlug(String slug);

    RouterBrand findById(UUID id);

    RouterBrandResponse create(RouterBrandRequest request);

    RouterBrandResponse update(String slug, RouterBrandRequest request);

    void toggleActive(String slug);

    /**
     * Supprime la marque. Échoue s'il reste des modèles liés.
     */
    void delete(String slug);

    /**
     * Retourne l'entité brute (pour usage interne).
     */
    RouterBrand getBrandOrThrow(String slug);
}
