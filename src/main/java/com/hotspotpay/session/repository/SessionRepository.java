package com.hotspotpay.session.repository;

import com.hotspotpay.session.enumeration.SessionStatus;
import com.hotspotpay.session.model.Session;
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

public interface SessionRepository extends JpaRepository<Session, UUID> {

    Optional<Session> findBySessionId(String sessionId);

    Optional<Session> findByPaymentId(String paymentId);

    Page<Session> findAllByHotspotIdOrderByActivatedAtDesc(String hotspotId, Pageable pageable);

    long countByHotspotIdAndStatus(String hotspotId, SessionStatus status);

    /**
     * Sessions ACTIVE dont le temps est écoulé → à expirer par SessionExpiryJob.
     * Note : les sessions PENDING_MIKROTIK ne sont pas expirées ici —
     * elles passeront en ACTIVE uniquement après confirmation du routeur.
     */
    @Query("""
        SELECT s FROM Session s
        WHERE s.status = 'ACTIVE'
        AND s.expiresAt <= :now
        """)
    List<Session> findExpiredActive(@Param("now") LocalDateTime now);

    /**
     * Sessions PENDING_MIKROTIK créées il y a plus de N minutes sans confirmation —
     * indique un problème de connectivité avec le routeur.
     * Utilisé par un éventuel monitoring.
     */
    @Query("""
        SELECT s FROM Session s
        WHERE s.status = 'PENDING_MIKROTIK'
        AND s.activatedAt < :cutoff
        """)
    List<Session> findStalePendingMikrotik(@Param("cutoff") LocalDateTime cutoff);

    @Modifying(clearAutomatically = true)
    @Query("""
        UPDATE Session s
        SET s.status = :status,
            s.expiredAt = :expiredAt,
            s.updatedAt = :now
        WHERE s.sessionId = :sessionId
        """)
    void updateStatus(
            @Param("sessionId") String sessionId,
            @Param("status")    SessionStatus status,
            @Param("expiredAt") LocalDateTime expiredAt,
            @Param("now")       LocalDateTime now
    );
}
