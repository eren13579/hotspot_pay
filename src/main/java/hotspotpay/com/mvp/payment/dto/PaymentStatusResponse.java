package hotspotpay.com.mvp.payment.dto;

import hotspotpay.com.mvp.payment.enumeration.PaymentStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PaymentStatusResponse {
    private String reference;
    private PaymentStatus status;
    private String message;
    private LocalDateTime paidAt;
    private LocalDateTime expiresAt;
    // Rempli quand status = PAID
    private SessionInfo session;

    @Getter
    @Builder
    public static class SessionInfo {
        private String sessionId;
        private LocalDateTime activatedAt;
        private LocalDateTime expiresAt;
        private String durationLabel;
    }
}