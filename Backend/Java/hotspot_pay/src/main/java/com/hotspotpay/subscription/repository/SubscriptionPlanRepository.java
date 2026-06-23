package com.hotspotpay.subscription.repository;

import com.hotspotpay.subscription.model.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {

    Optional<SubscriptionPlan> findByPlanName(String planName);

    boolean existsByPlanName(String planName);
}
