package hotspotpay.com.mvp.hotspot.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "hotspots")
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
@EntityListeners(AuditingEntityListener.class)
public class Hotspot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "hotspot_id", unique = true, nullable = false)
    private String hotspotId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(nullable = false, length = 100)
    private String name;

    private String location;

    @Column(name = "mikrotik_ip", nullable = false, length = 45)
    private String mikrotikIp;

    @Builder.Default
    @Column(name = "mikrotik_port")
    private Integer mikrotikPort = 8728;

    @Column(name = "mikrotik_user", nullable = false, length = 100)
    private String mikrotikUser;

    @Column(name = "mikrotik_password_enc", nullable = false)
    private String mikrotikPasswordEnc;

    @Column(name = "hotspot_profile")
    @Builder.Default
    private String hotspotProfile = "default";

    @Column(name = "is_online")
    @Builder.Default
    private Boolean isOnline = false;

    @Column(name = "last_ping_at")
    private LocalDateTime lastPingAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
