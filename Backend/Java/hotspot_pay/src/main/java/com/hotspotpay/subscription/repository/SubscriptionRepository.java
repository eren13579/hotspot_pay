package com.hotspotpay.subscription.repository;

import com.hotspotpay.subscription.enumeration.SubscriptionStatus;
import com.hotspotpay.subscription.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findByUserUserIdAndStatus(String userId, SubscriptionStatus status);

    List<Subscription> findAllByUserUserIdOrderByCreatedAtDesc(String userId);

    Optional<Subscription> findByPaymentReference(String paymentReference);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.expiresAt < :now")
    List<Subscription> findExpiredSubscriptions(@Param("now") LocalDateTime now);
}
