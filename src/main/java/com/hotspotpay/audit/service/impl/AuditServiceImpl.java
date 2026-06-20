package com.hotspotpay.audit.service.impl;

import com.hotspotpay.audit.model.AuditLog;
import com.hotspotpay.audit.repository.AuditLogRepository;
import com.hotspotpay.audit.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository repository;

    @Async
    @Override
    public void log(String action, String entityType, String entityId, String details) {
        try {
            repository.save(AuditLog.builder()
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .details(details)
                    .createdAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.warn("Audit log error: {}", e.getMessage());
        }
    }

    @Async
    @Override
    public void log(String userId, String hotspotId, String action, String entityType,
                    String entityId, String clientPhone, String clientMac, String details) {
        try {
            repository.save(AuditLog.builder()
                    .userId(userId)
                    .hotspotId(hotspotId)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .clientPhone(clientPhone)
                    .clientMac(clientMac)
                    .details(details)
                    .createdAt(LocalDateTime.now())
                    .build());
        } catch (Exception e) {
            log.warn("Audit log error: {}", e.getMessage());
        }
    }
}
