package com.hotspotpay.plan.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "plans")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
@EntityListeners(AuditingEntityListener.class)
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "plan_id", unique = true, nullable = false)
    private String planId;

    // Référence au hotspot (hotspot_id de la table hotspots)
    @Column(name = "hotspot_id", nullable = false)
    private String hotspotId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    // Durée en minutes (60 = 1h, 1440 = 24h, etc.)
    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(length = 5)
    @Builder.Default
    private String currency = "XAF";

    // NULL = illimité
    @Column(name = "download_speed_kbps")
    private Integer downloadSpeedKbps;

    @Column(name = "upload_speed_kbps")
    private Integer uploadSpeedKbps;

    // NULL = illimité
    @Column(name = "data_limit_mb")
    private Integer dataLimitMb;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    /** Profil MikroTik HotSpot à appliquer (ex: "default", "premium"). */
    @Column(name = "hotspot_profile", length = 100)
    @Builder.Default
    private String hotspotProfile = "default";

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}