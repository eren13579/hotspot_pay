package com.hotspotpay.hotspot.repository;

import com.hotspotpay.hotspot.model.Hotspot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HotspotRepository extends JpaRepository<Hotspot, UUID> {

    Optional<Hotspot> findByHotspotId(String hotspotId);
    Optional<Hotspot> findByHotspotIdAndUserId(String hotspotId, String userId);
    Page<Hotspot>     findAllByUserId(String userId, Pageable pageable);
    boolean           existsByHotspotId(String hotspotId);
    boolean           existsByMikrotikIpAndUserId(String mikrotikIp, String userId);
    List<Hotspot>     findAllByIsOnlineTrue();

    /** Recherche par router_token — pour validation dans RouterActionService */
    Optional<Hotspot> findByRouterToken(String routerToken);

    /** Liste des hotspots d'un utilisateur — pour dashboard/comptage */
    List<Hotspot> findByUserId(String userId);

    /** Utilisé par PlanLimitService pour compter les hotspots d'un utilisateur */
    long countByUserId(String userId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Hotspot h SET h.isOnline = :status, h.lastPingAt = :pingAt, h.updatedAt = :pingAt WHERE h.hotspotId = :hotspotId")
    void updateOnlineStatus(
            @Param("hotspotId") String hotspotId,
            @Param("status")    boolean status,
            @Param("pingAt")    LocalDateTime pingAt
    );
}
