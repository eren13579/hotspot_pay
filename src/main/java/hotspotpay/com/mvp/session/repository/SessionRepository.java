package hotspotpay.com.mvp.session.repository;

import hotspotpay.com.mvp.session.model.Session;
import hotspotpay.com.mvp.session.enumeration.SessionStatus;
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

    // Sessions ACTIVE expirées — pour le scheduler
    @Query("""
        SELECT s FROM Session s
        WHERE s.status = 'ACTIVE'
        AND s.expiresAt <= :now
    """)
    List<Session> findExpiredActive(@Param("now") LocalDateTime now);

    @Modifying
    @Query("""
        UPDATE Session s SET s.status = :status,
        s.expiredAt = :expiredAt, s.updatedAt = :now
        WHERE s.sessionId = :sessionId
    """)
    void updateStatus(@Param("sessionId") String sessionId,
                      @Param("status") SessionStatus status,
                      @Param("expiredAt") LocalDateTime expiredAt,
                      @Param("now") LocalDateTime now);
}