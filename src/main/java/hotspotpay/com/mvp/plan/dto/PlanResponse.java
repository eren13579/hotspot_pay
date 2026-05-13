package hotspotpay.com.mvp.plan.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlanResponse {

    private String planId;
    private String hotspotId;
    private String name;
    private String description;
    private Integer durationMinutes;
    private String durationLabel;      // ✅ "1h", "24h", "7 jours" — calculé automatiquement
    private BigDecimal price;
    private String currency;
    private String priceLabel;         // ✅ "200 XAF" — pour l'affichage portail
    private Integer downloadSpeedKbps;
    private Integer uploadSpeedKbps;
    private Integer dataLimitMb;
    private String dataLimitLabel;     // ✅ "500 MB", "Illimité" — calculé automatiquement
    private Integer displayOrder;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}