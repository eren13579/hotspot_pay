package com.hotspotpay.withdrawal.repository;

import com.hotspotpay.withdrawal.enumeration.WithdrawalStatus;
import com.hotspotpay.withdrawal.model.Withdrawal;
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
}
