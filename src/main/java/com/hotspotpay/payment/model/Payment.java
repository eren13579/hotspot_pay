package com.hotspotpay.payment.model;

import com.hotspotpay.payment.enumeration.PaymentOperator;
import com.hotspotpay.payment.enumeration.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payments")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
@EntityListeners(AuditingEntityListener.class)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "payment_id", unique = true, nullable = false)
    private String paymentId;

    @Column(unique = true, nullable = false)
    private String reference;

    @Column(name = "hotspot_id", nullable = false)
    private String hotspotId;

    @Column(name = "plan_id", nullable = false)
    private String planId;

    @Column(name = "client_phone", nullable = false, length = 20)
    private String clientPhone;

    @Column(name = "client_mac", nullable = true, length = 17)
    private String clientMac;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentOperator operator;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(length = 5)
    @Builder.Default
    private String currency = "XAF";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "gateway_tx_id")
    private String gatewayTxId;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "retry_count")
    @Builder.Default
    private Integer retryCount = 0;

    @Column(name = "webhook_received_at")
    private LocalDateTime webhookReceivedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * Description lisible du paiement (ex: "Forfait 2h - Hotspot Centre Ville")
     */
    @Column(length = 255)
    private String description;

    /** URL checkout Moneroo — pour rediriger le client vers la page de paiement */
    @Column(name = "checkout_url", length = 1000)
    private String checkoutUrl;

    @Column(name = "manual_connect")
    @Builder.Default
    private Boolean manualConnect = false;

    @Column(name = "manual_username", length = 100)
    private String manualUsername;

    @Column(name = "manual_password", length = 100)
    private String manualPassword;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}