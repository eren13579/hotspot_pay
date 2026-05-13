package com.hotspotpay.session.service;

import com.hotspotpay.session.dto.SessionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SessionService {
    Page<SessionResponse> findByHotspot(String userId, String hotspotId, Pageable pageable);
    SessionResponse findById(String userId, String sessionId);
    void revoke(String userId, String sessionId);
}