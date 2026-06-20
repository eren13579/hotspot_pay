package com.hotspotpay.router.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;
import java.util.UUID;

@Data
public class RouterModelRequest {

    @NotBlank(message = "Le nom du modèle est requis")
    private String name;

    @NotBlank(message = "Le slug est requis")
    private String slug;

    @NotNull(message = "L'ID de la marque est requis")
    private UUID brandId;

    private String connectionType;
    private Integer defaultPort;
    private Map<String, Object> configSchema;
    private Boolean isActive;
}
