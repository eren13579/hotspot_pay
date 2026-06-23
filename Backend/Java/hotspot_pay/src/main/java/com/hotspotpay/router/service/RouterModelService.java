package com.hotspotpay.router.service;

import com.hotspotpay.router.dto.RouterModelRequest;
import com.hotspotpay.router.dto.RouterModelResponse;

import java.util.List;
import java.util.UUID;

public interface RouterModelService {

    List<RouterModelResponse> findByBrand(UUID brandId);

    List<RouterModelResponse> findActiveByBrand(UUID brandId);

    RouterModelResponse findById(UUID id);

    RouterModelResponse create(RouterModelRequest request);

    RouterModelResponse update(UUID id, RouterModelRequest request);

    void toggleActive(UUID id);

    void delete(UUID id);
}
