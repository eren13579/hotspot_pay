package com.hotspotpay.config;

import com.hotspotpay.auth.filter.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter      jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ── Public — portail captif ──────────────────────────────
                .requestMatchers("/portal/**").permitAll()

                // ── Public — hotspots (infos publiques) ──────────────────
                .requestMatchers(new AntPathRequestMatcher("/hotspots/public/**")).permitAll()
                .requestMatchers(HttpMethod.GET, "/hotspots/public/**").permitAll()
                .requestMatchers("/api/V1/hotspots/public/**").permitAll()

                // ── Public — authentification ────────────────────────────
                .requestMatchers("/auth/**").permitAll()

                // ── Public — documentation Swagger ───────────────────────
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).permitAll()

                // ── Public — webhooks opérateurs ─────────────────────────
                .requestMatchers("/payments/*/webhook").permitAll()

                // ── Public — Router Pull API (MikroTik) ───────────────────
                .requestMatchers("/router/**", "/router-brands/**").permitAll()

                // ── Public — Router Callback ──────────────────────────────
                .requestMatchers("/internal/router-callback/**").permitAll()

                // ── Public — portail captif tickets ──────────────────────
                .requestMatchers("/portal/*/tickets/**").permitAll()

                // ── Public — plans d'abonnement ──────────────────────────
                .requestMatchers("/subscriptions/plans").permitAll()

                // ── Public — paramètres système (landing page) ──────────
                .requestMatchers("/public/**").permitAll()

                // ── Public — Actuator health ─────────────────────────────
                .requestMatchers("/actuator/health").permitAll()

                // ── Protégés — admin uniquement ──────────────────────────
                .requestMatchers("/admin/**").hasRole("ADMIN")

                // ── Protégés — utilisateurs authentifiés ─────────────────
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Value("${cors.allowed-origins:*}")
    private String corsAllowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = List.of(corsAllowedOrigins.split(","));

        if (origins.size() == 1 && "*".equals(origins.get(0).trim())) {
            // Dev uniquement : tout autoriser SANS credentials (conforme RFC 6454)
            config.setAllowedOriginPatterns(List.of("*"));
            config.setAllowCredentials(false);
        } else {
            // Production : origines explicites AVEC credentials
            config.setAllowedOrigins(origins);
            config.setAllowCredentials(true);
        }
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }
}
