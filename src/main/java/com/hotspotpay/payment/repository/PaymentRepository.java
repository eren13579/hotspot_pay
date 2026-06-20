package com.hotspotpay.payment.repository;

import com.hotspotpay.payment.model.Payment;
import com.hotspotpay.payment.enumeration.PaymentStatus;
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

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByReference(String reference);
    Optional<Payment> findByPaymentId(String paymentId);

    Page<Payment> findAllByHotspotIdOrderByCreatedAtDesc(String hotspotId, Pageable pageable);

    // Paiements PENDING pour le polling job
    @Query("""
        SELECT p FROM Payment p
        WHERE p.status = 'PENDING'
        AND p.expiresAt > :now
        ORDER BY p.createdAt ASC
    """)
    List<Payment> findPendingNotExpired(@Param("now") LocalDateTime now);

    // Paiements PENDING expirés — à marquer EXPIRED
    @Query("""
        SELECT p FROM Payment p
        WHERE p.status = 'PENDING'
        AND p.expiresAt <= :now
    """)
    List<Payment> findExpiredPending(@Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true)
    @Query("""
        UPDATE Payment p SET p.status = :status,
        p.updatedAt = :now
        WHERE p.reference = :reference
        AND p.status = 'PENDING'
    """)
    int updateStatus(@Param("reference") String reference,
                     @Param("status") PaymentStatus status,
                     @Param("now") LocalDateTime now);
}