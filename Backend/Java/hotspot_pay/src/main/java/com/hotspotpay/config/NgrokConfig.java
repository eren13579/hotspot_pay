package com.hotspotpay.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class NgrokConfig {

    /**
     * Filtre qui bypass la page d'avertissement ngrok.
     * Sans ça, ngrok retourne du HTML au lieu de ton API
     * quand la requête vient d'un service tiers (Moneroo, Campay).
     */
    @Bean
    public FilterRegistrationBean<NgrokHeaderFilter> ngrokFilter() {
        FilterRegistrationBean<NgrokHeaderFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(new NgrokHeaderFilter());
        bean.addUrlPatterns("/*");
        bean.setOrder(1);
        return bean;
    }

    public static class NgrokHeaderFilter implements Filter {
        @Override
        public void doFilter(ServletRequest req, ServletResponse res,
                             FilterChain chain) throws IOException, ServletException {
            HttpServletResponse response = (HttpServletResponse) res;
            // ✅ Bypass la page HTML d'avertissement ngrok
            response.setHeader("ngrok-skip-browser-warning", "true");
            chain.doFilter(req, res);
        }
    }
}