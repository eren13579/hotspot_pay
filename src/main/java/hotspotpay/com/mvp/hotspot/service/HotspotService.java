package hotspotpay.com.mvp.hotspot.service;

import hotspotpay.com.mvp.hotspot.dto.CreateHotspotRequest;
import hotspotpay.com.mvp.hotspot.dto.HotspotResponse;
import hotspotpay.com.mvp.hotspot.dto.HotspotStatusResponse;
import hotspotpay.com.mvp.hotspot.dto.UpdateHotspotRequest;
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
