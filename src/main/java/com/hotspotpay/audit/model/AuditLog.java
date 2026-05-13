package com.hotspotpay.audit.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action;

    private String entityType;

    private String entityId;

    private String clientPhone;

    private String clientMac;

    @Column(columnDefinition = "TEXT")
    private String details;

    private LocalDateTime createdAt;
}
