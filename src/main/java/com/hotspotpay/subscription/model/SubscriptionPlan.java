package com.hotspotpay.subscription.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
@EntityListeners(AuditingEntityListener.class)
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "plan_name", unique = true, nullable = false, length = 50)
    private String planName;

    @Column(name = "monthly_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyPrice;

    @Column(name = "yearly_price", precision = 10, scale = 2)
    private BigDecimal yearlyPrice;

    @Column(name = "max_hotspots")
    private Integer maxHotspots;

    @Column(length = 500)
    private String description;

    @Column(name = "is_popular")
    @Builder.Default
    private boolean isPopular = false;

    @Column(name = "is_active")
    @Builder.Default
    private boolean isActive = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "advantages", columnDefinition = "jsonb")
    private Map<String, Object> advantages;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
