package com.hotspotpay.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI hotspotPayOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HotspotPay SaaS API")
                        .version("v1.0-MVP")
                        .description("API de gestion et monétisation de hotspots WiFi via Mobile Money")
                        .contact(new Contact()
                                .name("Patrick Teda")
                                .email("tedapatrick4@gmail.com")))
                // ✅ Ajoute le support du JWT Bearer dans Swagger UI
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