package com.hotspotpay.monitoring.service.impl;

import com.hotspotpay.hotspot.repository.HotspotRepository;
import com.hotspotpay.monitoring.dto.SystemHealthDto;
import com.hotspotpay.monitoring.service.HealthService;
import com.hotspotpay.payment.repository.PaymentRepository;
import com.hotspotpay.session.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthServiceImpl implements HealthService {

    private final JdbcTemplate                 jdbcTemplate;
    private final RedisTemplate<String,String> redisTemplate;
    private final PaymentRepository            paymentRepository;
    private final SessionRepository            sessionRepository;
    private final HotspotRepository            hotspotRepository;

    @Override
    public SystemHealthDto check() {
        Map<String, String> components = new HashMap<>();
        boolean allOk = true;

        // PostgreSQL
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            components.put("database", "UP");
        } catch (Exception e) {
            components.put("database", "DOWN");
            allOk = false;
            log.error("DB health check failed: {}", e.getMessage());
        }

        // Redis
        try {
            redisTemplate.opsForValue().get("hp:health");
            components.put("redis", "UP");
        } catch (Exception e) {
            components.put("redis", "DEGRADED");
            log.warn("Redis health check failed: {}", e.getMessage());
        }

        long pending  = paymentRepository.findPendingNotExpired(LocalDateTime.now()).size();
        long sessions = sessionRepository.count();
        long online   = hotspotRepository.findAllByIsOnlineTrue().size();

        return SystemHealthDto.builder()
                .status(allOk ? "UP" : "DEGRADED")
                .checkedAt(LocalDateTime.now())
                .components(components)
                .pendingPayments(pending)
                .activeSessions(sessions)
                .onlineHotspots(online)
                .appVersion("1.0.0-MVP")
                .build();
    }
}
