package com.hotspotpay.dashboard.service;

import com.hotspotpay.dashboard.dto.HotspotStatsDto;
import com.hotspotpay.dashboard.dto.OverviewDto;
import com.hotspotpay.session.model.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DashboardService {
    OverviewDto getOverview(String userId);
    HotspotStatsDto getHotspotStats(String userId, String hotspotId);
    Page<Session> getActiveSessions(String userId, String hotspotId, Pageable pageable);
}