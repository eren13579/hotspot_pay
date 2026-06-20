package com.hotspotpay.router.filter;

import com.hotspotpay.config.SecurityConfig;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Filtre de sécurité pour l'endpoint /internal/router-callback.
 *
 * En production, restreint l'accès à une liste d'IPs autorisées.
 * En développement, permet toutes les IPs.
 */
@Slf4j
@Component
@WebFilter("/internal/router-callback/*")
public class RouterCallbackIpFilter implements Filter {

    private final Environment environment;

    public RouterCallbackIpFilter(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String clientIp = getClientIp(httpRequest);
        String allowedIpsEnv = environment.getProperty("router.callback.allowed-ips", "*");

        if ("*".equals(allowedIpsEnv.trim())) {
            // Mode développement : tout autoriser
            chain.doFilter(request, response);
            return;
        }

        List<String> allowedIps = Arrays.stream(allowedIpsEnv.split(","))
                .map(String::trim)
                .filter(ip -> !ip.isEmpty())
                .collect(Collectors.toList());

        if (allowedIps.isEmpty() || allowedIps.contains(clientIp)) {
            chain.doFilter(request, response);
        } else {
            log.warn("IP non autorisée pour router-callback: {} (allowed: {})", clientIp, allowedIpsEnv);
            httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
            httpResponse.getWriter().write("{\"error\":\"IP non autorisée\"}");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}