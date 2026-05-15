package com.hotspotpay.ratelimit.filter;

import com.hotspotpay.ratelimit.service.RateLimitService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter implements Filter {

    private final RateLimitService rateLimitService;

    private static final int PORTAL_MAX_REQUESTS = 15;
    private static final int PORTAL_WINDOW_SECONDS = 60;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = req.getRequestURI();

        // Appliquer le rate limit sur le portail captif
        if (path.startsWith("/portal")) {
            String clientIp = getClientIP(req);
            String key = "portal:" + clientIp;

            if (!rateLimitService.isAllowed(key, PORTAL_MAX_REQUESTS, PORTAL_WINDOW_SECONDS)) {
                log.warn("Rate limit exceeded for IP: {}", clientIp);
                res.setStatus(429);
                res.getWriter().write("{\"message\": \"Trop de requêtes. Veuillez réessayer plus tard.\"}");
                return;
            }

            rateLimitService.recordRequest(key);
        }

        chain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}