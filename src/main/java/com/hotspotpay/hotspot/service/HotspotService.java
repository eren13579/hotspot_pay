package com.hotspotpay.hotspot.service;

import com.hotspotpay.hotspot.dto.CreateHotspotRequest;
import com.hotspotpay.hotspot.dto.HotspotResponse;
import com.hotspotpay.hotspot.dto.HotspotStatusResponse;
import com.hotspotpay.hotspot.dto.UpdateHotspotRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface HotspotService {

    HotspotResponse create(String userId, CreateHotspotRequest request);
    Page<HotspotResponse> findAll(String userId, Pageable pageable);
    HotspotResponse findById(String userId, String hotspotId);
    HotspotResponse update(String userId, String hotspotId, UpdateHotspotRequest request);
    void delete(String userId, String hotspotId);
    HotspotStatusResponse testConnection(String userId, String hotspotId);
}
