package com.hotspotpay.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    @Value("${app.base-url:http://localhost:8080/api/V1}")
    private String baseUrl;

    @Bean
    public OpenAPI hotspotPayOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HotspotPay SaaS API")
                        .version("v1.0-MVP")
                        .description("API de gestion et monétisation de hotspots WiFi via Mobile Money\n\n"
                                + "---\n"
                                + "**Logique métier (FastAPI — microservice interne)**\n"
                                + "Accès direct (réservé au backend Java) : http://localhost:8444/docs\n"
                                + "Endpoints FastAPI disponibles :\n"
                                + "- Dashboard : GET /api/v1/dashboard/overview, GET /api/v1/dashboard/hotspot/{id}\n"
                                + "- Abonnements : GET /api/v1/subscriptions/plans, GET /api/v1/subscriptions/me, POST /api/v1/subscriptions\n"
                                + "- Sessions : GET /api/v1/sessions/active, GET /api/v1/sessions/hotspot/{id}, POST .../revoke\n"
                                + "- Tickets : GET /api/v1/tickets, POST /api/v1/tickets/import, POST .../activate, POST .../activate-direct\n"
                                + "- Paiements : POST /api/v1/payments/initiate, POST /api/v1/payments/webhook/{op}\n"
                                + "- Hotspots : CRUD /api/v1/hotspots, POST .../test, POST .../generate-token\n"
                                + "- Plans : CRUD /api/v1/hotspots/{id}/plans\n"
                                + "- Routeur : GET /api/v1/router/{id}/pending-actions\n"
                                + "- Portail captif : POST /api/v1/tickets/portal/connect, GET .../portal/{id}/{user}/info\n"
                                + "\n"
                                + "**Portails captifs (publics)**\n"
                                + "Ces endpoints sont accessibles sans JWT (utilisés par la page de connexion WiFi) :\n"
                                + "- POST /api/V1/portal/{hotspotId}/tickets/connect\n"
                                + "- GET /api/V1/portal/{hotspotId}/tickets/{username}/info\n")
                        .contact(new Contact()
                                .name("Patrick Teda")
                                .email("tedapatrick4@gmail.com")))
                // ✅ Serveur dynamique — utilise BASE_URL depuis application.properties
                .servers(List.of(
                        new Server()
                                .url(baseUrl)
                                .description("Serveur actif"),
                        new Server()
                                .url("http://localhost:8080/api/V1")
                                .description("Développement local")
                ))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Entrez votre JWT token")));
    }
}