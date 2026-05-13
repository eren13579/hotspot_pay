package hotspotpay.com.mvp.plan.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdatePlanRequest {

    @Size(max = 100)
    private String name;

    @Size(max = 255)
    private String description;

    @Min(value = 1)
    @Max(value = 44640)
    private Integer durationMinutes;

    @DecimalMin(value = "0.01")
    @Digits(integer = 10, fraction = 2)
    private BigDecimal price;

    @Size(max = 5)
    private String currency;

    @Min(value = 64)
    private Integer downloadSpeedKbps;

    @Min(value = 64)
    private Integer uploadSpeedKbps;

    @Min(value = 1)
    private Integer dataLimitMb;

    @Min(value = 0)
    private Integer displayOrder;
}