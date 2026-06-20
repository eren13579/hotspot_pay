package com.hotspotpay.ratelimit.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotspotpay.ratelimit.service.RateLimitService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * Filtre de limitation de débit (rate limiting) basé sur l'IP.
 * - Portail captif : 10 req/min par défaut
 * - Auth endpoints : 5 req/min par défaut
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter implements Filter {

    private final RateLimitService rateLimitService;
    private final ObjectMapper     objectMapper;

    @Value("${rate-limit.portal-per-minute:10}")
    private int portalRateLimit;

    @Value("${rate-limit.auth-per-minute:5}")
    private int authRateLimit;

    @Value("${rate-limit.webhook-per-minute:60}")
    private int webhookRateLimit;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path  = req.getRequestURI();
        String ip    = getClientIp(req);

        // Appliquer le rate-limit sur tous les endpoints portail, auth et webhooks
        boolean isWebhook = path.contains("/webhook");
        if (path.contains("/portal/") || path.contains("/auth/") || isWebhook) {
            int limit;
            String type;
            if (isWebhook) {
                // Webhooks opérateurs : limite plus haute (les IPs opérateur peuvent être partagées)
                // Configurable via rate-limit.webhook-per-minute (défaut: 60/min)
                limit = webhookRateLimit;
                type = "webhook";
            } else if (path.contains("/auth/")) {
                limit = authRateLimit;
                type = "auth";
            } else {
                limit = portalRateLimit;
                type = "portal";
            }
            String key = "rl:" + ip + ":" + type;

            boolean allowed = rateLimitService.checkAndRecord(key, limit, 60);
            long remaining = Math.max(0, limit - rateLimitService.getCount(key));
            long resetSeconds = rateLimitService.getTtlSeconds(key);

            // Toujours ajouter les headers rate-limit
            res.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            res.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));
            res.setHeader("X-RateLimit-Reset", String.valueOf(resetSeconds));

            if (!allowed) {
                log.warn("Rate limit dépassé — ip={}, path={}", ip, path);
                res.setStatus(429);
                res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                objectMapper.writeValue(res.getWriter(), Map.of(
                        "status", 429,
                        "error",  "Too Many Requests",
                        "message","Trop de requêtes — réessayez dans une minute"
                ));
                return;
            }
        }

        chain.doFilter(req, res);
    }

    private String getClientIp(HttpServletRequest req) {
        String xfwd = req.getHeader("X-Forwarded-For");
        if (xfwd != null && !xfwd.isBlank()) return xfwd.split(",")[0].trim();
        String xReal = req.getHeader("X-Real-IP");
        if (xReal != null && !xReal.isBlank()) return xReal;
        return req.getRemoteAddr();
    }
}
