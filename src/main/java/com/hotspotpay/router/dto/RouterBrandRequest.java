package com.hotspotpay.router.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RouterBrandRequest {

    @NotBlank(message = "Le nom de la marque est requis")
    private String name;

    @NotBlank(message = "Le slug est requis")
    private String slug;

    private String description;
    private String logoUrl;
    private Boolean isActive;
}
