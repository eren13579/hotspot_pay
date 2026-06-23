package com.hotspotpay.ticket.model;

import com.hotspotpay.ticket.enumeration.TicketStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Ticket WiFi importé depuis MikroTik.
 * Contient un couple username/password déjà créé côté routeur.
 */
@Entity
@Table(name = "tickets")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
@EntityListeners(AuditingEntityListener.class)
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ticket_id", unique = true, nullable = false)
    private String ticketId;

    @Column(name = "hotspot_id", nullable = false)
    private String hotspotId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false, length = 255)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 100)
    @Builder.Default
    private String profile = "default";

    @Column(length = 500)
    private String comment;

    @Column(name = "uptime_limit", length = 50)
    private String uptimeLimit;

    @Column(name = "data_limit", length = 50)
    private String dataLimit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TicketStatus status = TicketStatus.AVAILABLE;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "client_mac", length = 17)
    private String clientMac;

    @Column(name = "client_phone", length = 20)
    private String clientPhone;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
