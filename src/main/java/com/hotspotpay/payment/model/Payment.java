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

    // Clé d'idempotence — unique par transaction
    @Column(unique = true, nullable = false)
    private String reference;

    @Column(name = "hotspot_id", nullable = false)
    private String hotspotId;

    @Column(name = "plan_id", nullable = false)
    private String planId;

    @Column(name = "client_phone", nullable = false, length = 20)
    private String clientPhone;

    // MAC address du client — passée par MikroTik dans l'URL de redirection
    @Column(name = "client_mac", nullable = false, length = 17)
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

    // ID retourné par l'opérateur (MTN / Orange)
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

    // Quand le paiement expire si non confirmé (PENDING → EXPIRED)
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}