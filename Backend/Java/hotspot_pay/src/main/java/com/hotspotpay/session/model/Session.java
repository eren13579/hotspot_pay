package com.hotspotpay.session.model;

import com.hotspotpay.session.enumeration.SessionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sessions")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter @Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@EntityListeners(AuditingEntityListener.class)
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "session_id", unique = true, nullable = false)
    private String sessionId;

    @Column(name = "payment_id", unique = true, nullable = true)
    private String paymentId;

    @Column(name = "hotspot_id", nullable = false)
    private String hotspotId;

    @Column(name = "plan_id", nullable = false)
    private String planId;

    @Column(name = "client_phone", nullable = false, length = 20)
    private String clientPhone;

    @Column(name = "client_mac", nullable = true, length = 17)
    private String clientMac;

    // Compte créé sur MikroTik
    @Column(name = "mikrotik_username", nullable = false, length = 100)
    private String mikrotikUsername;

    @Column(name = "mikrotik_password", nullable = false, length = 100)
    private String mikrotikPassword;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.PENDING_MIKROTIK;

    @Column(name = "activated_at", nullable = false)
    private LocalDateTime activatedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    @Column(name = "bytes_in")
    @Builder.Default
    private Long bytesIn = 0L;

    @Column(name = "bytes_out")
    @Builder.Default
    private Long bytesOut = 0L;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}