package com.hotspotpay.scheduler.service;

public interface SchedulerService {
    void scheduleSessionExpiryCheck();
    void schedulePaymentExpiryCheck();
    void scheduleMonthlyQuotaReset();
    void scheduleHotspotHealthCheck();
}