package com.hotspotpay.payment.repository;

import com.hotspotpay.payment.model.UserWithdrawal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface UserWithdrawalRepository extends JpaRepository<UserWithdrawal, Long> {

    @Query("SELECT COALESCE(SUM(uw.amount), 0) FROM UserWithdrawal uw WHERE uw.user.userId = :userId AND uw.withdrawnAt BETWEEN :startDate AND :endDate")
    BigDecimal sumAmountByUserAndDate(@Param("userId") String userId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}