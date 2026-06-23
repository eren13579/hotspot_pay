package com.hotspotpay.systemsettings.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SettingItemUpdateRequest {

    @NotBlank(message = "Clé obligatoire")
    @Size(max = 120, message = "Clé trop longue")
    private String key;

    @Size(max = 4000, message = "Valeur trop longue")
    private String value;
}
