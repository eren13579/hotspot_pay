package com.hotspotpay.withdrawal.model;

import com.hotspotpay.withdrawal.enumeration.WithdrawalStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "withdrawals")
@AllArgsConstructor @NoArgsConstructor @Builder @Getter @Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@EntityListeners(AuditingEntityListener.class)
public class Withdrawal {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "withdrawal_id", unique = true, nullable = false)
    private String withdrawalId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(length = 5)
    @Builder.Default
    private String currency = "XAF";

    /** Numéro de téléphone Mobile Money du destinataire */
    @Column(name = "recipient_phone", nullable = false, length = 20)
    private String recipientPhone;

    /** Opérateur de retrait : MTN_MOMO, ORANGE_MONEY, etc. */
    @Column(nullable = false, length = 30)
    private String operator;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private WithdrawalStatus status = WithdrawalStatus.PENDING;

    @Column(name = "gateway_ref")
    private String gatewayRef;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
