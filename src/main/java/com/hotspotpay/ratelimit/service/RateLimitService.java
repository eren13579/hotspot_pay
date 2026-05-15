package com.hotspotpay.ratelimit.service;

public interface RateLimitService {
    boolean isAllowed(String key, int maxRequests, int windowSeconds);
    void recordRequest(String key);
}