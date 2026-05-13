package hotspotpay.com.mvp.users.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @Size(max = 100, message = "Nom trop long")
    private String fullName;

    @Size(max = 5, message = "Code pays invalide")
    private String country;

    @Pattern(
            regexp = "^\\+?[1-9]\\d{7,14}$",
            message = "Format téléphone invalide"
    )
    private String phone;

    private String planType;
}