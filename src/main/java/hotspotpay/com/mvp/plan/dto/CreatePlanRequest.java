package hotspotpay.com.mvp.plan.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePlanRequest {

    @NotBlank(message = "Le nom du forfait est obligatoire")
    @Size(max = 100, message = "Nom trop long (max 100 caractères)")
    private String name;

    @Size(max = 255, message = "Description trop longue")
    private String description;

    @NotNull(message = "La durée est obligatoire")
    @Min(value = 1, message = "La durée doit être d'au moins 1 minute")
    @Max(value = 44640, message = "La durée ne peut pas dépasser 31 jours (44640 min)")
    private Integer durationMinutes;

    @NotNull(message = "Le prix est obligatoire")
    @DecimalMin(value = "0.01", message = "Le prix doit être supérieur à 0")
    @Digits(integer = 10, fraction = 2, message = "Format de prix invalide")
    private BigDecimal price;

    @Size(max = 5, message = "Code devise invalide")
    private String currency = "XAF";

    // NULL = illimité
    @Min(value = 64, message = "Vitesse download minimum 64 kbps")
    private Integer downloadSpeedKbps;

    @Min(value = 64, message = "Vitesse upload minimum 64 kbps")
    private Integer uploadSpeedKbps;

    // NULL = illimité
    @Min(value = 1, message = "Limite data minimum 1 MB")
    private Integer dataLimitMb;

    @Min(value = 0, message = "L'ordre d'affichage doit être positif")
    private Integer displayOrder = 0;
}