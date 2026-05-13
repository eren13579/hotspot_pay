package com.hotspotpay.audit.service;

public interface AuditService {

    void log(String action, String entityType, String entityId, String details);
}