package com.hotspotpay.audit.service;

public interface AuditService {
    void log(String action, String entityType, String entityId, String details);
    void log(String userId, String hotspotId, String action, String entityType,
             String entityId, String clientPhone, String clientMac, String details);
}
