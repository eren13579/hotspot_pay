package com.hotspotpay.ratelimit.service.impl;

import com.hotspotpay.ratelimit.service.RateLimitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class RateLimitServiceImpl implements RateLimitService {

    private final Map<String, RequestWindow> windows = new ConcurrentHashMap<>();

    @Override
    public boolean isAllowed(String key, int maxRequests, int windowInSeconds) {
        RequestWindow window = windows.computeIfAbsent(key, k -> new RequestWindow());
        return window.isAllowed(maxRequests, windowInSeconds);
    }

    @Override
    public void recordRequest(String key) {
        windows.computeIfAbsent(key, k -> new RequestWindow()).recordRequest();
    }

    private static class RequestWindow {
        private LocalDateTime windowStart = LocalDateTime.now();
        private int count = 0;

        public synchronized boolean isAllowed(int maxRequests, int windowSeconds) {
            LocalDateTime now = LocalDateTime.now();
            if (now.minusSeconds(windowSeconds).isAfter(windowStart)) {
                windowStart = now;
                count = 0;
            }
            return count < maxRequests;
        }

        public synchronized void recordRequest() {
            count++;
        }
    }
}