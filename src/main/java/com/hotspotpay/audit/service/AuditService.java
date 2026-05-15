package com.hotspotpay.audit.service;

import java.util.Map;

public interface AuditService {

    void log(String action, String entityType, String entityId, Map<String, Object> details, String s);
}