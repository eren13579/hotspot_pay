package com.hotspotpay.subscription.repository;

import com.hotspotpay.subscription.model.Subscription;
import com.hotspotpay.subscription.enumeration.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findBySubscriptionId(String subscriptionId);

    Optional<Subscription> findByUserUserIdAndStatus(String userId, SubscriptionStatus status);

    List<Subscription> findAllByUserUserIdOrderByCreatedAtDesc(String userId);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.expiresAt <= :now")
    List<Subscription> findExpiredSubscriptions(LocalDateTime now);

    Optional<Subscription> findByPaymentReference(String reference);
}