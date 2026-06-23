package com.hotspotpay.audit.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@AllArgsConstructor @NoArgsConstructor @Builder @Data
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "hotspot_id")
    private String hotspotId;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "entity_type", length = 50)
    private String entityType;

    @Column(name = "entity_id", length = 100)
    private String entityId;

    @Column(name = "client_phone", length = 20)
    private String clientPhone;

    @Column(name = "client_mac", length = 17)
    private String clientMac;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /** Détails JSON ou texte libre */
    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
