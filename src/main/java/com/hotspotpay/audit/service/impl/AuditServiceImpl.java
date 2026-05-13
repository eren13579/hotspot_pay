package com.hotspotpay.audit.service.impl;

import com.hotspotpay.audit.model.AuditLog;
import com.hotspotpay.audit.repository.AuditLogRepository;
import com.hotspotpay.audit.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository repository;

    @Override
    public void log(String action, String entityType, String entityId, String details) {

        AuditLog log = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();

        repository.save(log);
    }
}