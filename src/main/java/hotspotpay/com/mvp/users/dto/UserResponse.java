package hotspotpay.com.mvp.users.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponse {
    private String userId;
    private String email;
    private String phone;
    private String fullName;
    private String country;
    private String planType;
    private String role;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}