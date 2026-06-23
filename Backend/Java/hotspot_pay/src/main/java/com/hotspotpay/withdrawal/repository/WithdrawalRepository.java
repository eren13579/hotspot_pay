package com.hotspotpay.withdrawal.repository;

import com.hotspotpay.withdrawal.enumeration.WithdrawalStatus;
import com.hotspotpay.withdrawal.model.Withdrawal;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface WithdrawalRepository extends JpaRepository<Withdrawal, UUID> {

    Optional<Withdrawal> findByWithdrawalId(String withdrawalId);

    Page<Withdrawal> findAllByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    /** Calcule le total des retraits réussis pour un utilisateur */
    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w WHERE w.userId = :userId AND w.status = 'COMPLETED'")
    BigDecimal totalWithdrawn(@Param("userId") String userId);

    // ── Admin ──
    Page<Withdrawal> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Optional<Withdrawal> findByWithdrawalIdAndStatus(String withdrawalId, WithdrawalStatus status);

    /** Batch : trouver tous les retraits PENDING par leurs IDs */
    @Query("SELECT w FROM Withdrawal w WHERE w.withdrawalId IN :ids AND w.status = 'PENDING'")
    List<Withdrawal> findAllPendingByIds(@Param("ids") List<String> withdrawalIds);

    /** Compter les retraits PENDING */
    long countByStatus(WithdrawalStatus status);

    /** Compter les retraits créés aujourd'hui */
    @Query("SELECT COUNT(w) FROM Withdrawal w WHERE w.createdAt >= :since")
    long countCreatedSince(@Param("since") LocalDateTime since);
}
