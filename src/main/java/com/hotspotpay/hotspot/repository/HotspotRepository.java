package com.hotspotpay.hotspot.repository;

import com.hotspotpay.hotspot.model.Hotspot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface HotspotRepository extends JpaRepository<Hotspot, UUID> {

    Optional<Hotspot> findByHotspotId(String hotspotId);

    Optional<Hotspot> findByHotspotIdAndUserId(String hotspotId, String userId);

    boolean existsByMikrotikIpAndUserId(String mikrotikIp, String userId);

    Page<Hotspot> findAllByUserId(String userId, Pageable pageable);

    long countByUserId(String userId);  // Pour limiter selon planType

    @Modifying
    @Query("UPDATE Hotspot h SET h.isOnline = :isOnline, h.lastPingAt = :lastPingAt " +
            "WHERE h.hotspotId = :hotspotId")
    void updateOnlineStatus(
            @Param("hotspotId") String hotspotId,
            @Param("isOnline") boolean isOnline,
            @Param("lastPingAt") LocalDateTime lastPingAt
    );
}