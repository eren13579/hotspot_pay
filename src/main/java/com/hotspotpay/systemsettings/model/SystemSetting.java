package com.hotspotpay.systemsettings.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "setting_key", nullable = false, unique = true, length = 120)
    private String settingKey;

    @Column(name = "section_key", nullable = false, length = 80)
    private String sectionKey;

    @Column(name = "section_label", nullable = false, length = 100)
    private String sectionLabel;

    @Column(name = "label", nullable = false, length = 120)
    private String label;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "value_type", nullable = false, length = 20)
    private String valueType;

    @Column(name = "value", columnDefinition = "TEXT")
    private String value;

    @Column(name = "is_secret", nullable = false)
    @Builder.Default
    private Boolean isSecret = false;

    @Column(name = "is_editable", nullable = false)
    @Builder.Default
    private Boolean isEditable = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
