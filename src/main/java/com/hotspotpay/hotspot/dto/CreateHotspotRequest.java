package com.hotspotpay.hotspot.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateHotspotRequest {

    @NotBlank(message = "Le nom du hotspot est obligatoire")
    @Size(max = 100, message = "Nom trop long (max 100 caractères)")
    private String name;

    @Size(max = 255, message = "Localisation trop longue")
    private String location;

    @NotBlank(message = "L'IP MikroTik est obligatoire")
    @Pattern(
            regexp = "^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$",
            message = "Format IP invalide (ex: 192.168.1.1)"
    )
    private String mikrotikIp;

    @Min(value = 1, message = "Port invalide")
    @Max(value = 65535, message = "Port invalide")
    private Integer mikrotikPort = 8728;

    @NotBlank(message = "L'utilisateur MikroTik est obligatoire")
    private String mikrotikUser;

    @NotBlank(message = "Le mot de passe MikroTik est obligatoire")
    private String mikrotikPassword;

    @Size(max = 100)
    private String hotspotProfile = "default";
}
