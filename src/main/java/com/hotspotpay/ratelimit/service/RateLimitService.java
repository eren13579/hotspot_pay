package com.hotspotpay.ratelimit.service;

public interface RateLimitService {

    boolean isAllowed(String key);
}