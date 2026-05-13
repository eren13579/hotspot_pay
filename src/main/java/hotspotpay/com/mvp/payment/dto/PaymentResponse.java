package hotspotpay.com.mvp.payment.dto;

import hotspotpay.com.mvp.payment.enumeration.PaymentOperator;
import hotspotpay.com.mvp.payment.enumeration.PaymentStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class PaymentResponse {
    private String paymentId;
    private String reference;
    private String hotspotId;
    private String planId;
    private String clientPhone;
    private String clientMac;
    private PaymentOperator operator;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String gatewayTxId;
    private LocalDateTime paidAt;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}