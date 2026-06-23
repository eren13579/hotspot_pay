package com.hotspotpay.monitoring.service;

import com.hotspotpay.monitoring.dto.SystemHealthDto;
public interface HealthService {
    SystemHealthDto check();
}
