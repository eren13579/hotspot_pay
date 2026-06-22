package com.hotspotpay.subscription.service;

import com.hotspotpay.subscription.dto.*;

import java.util.List;
import java.util.UUID;

public interface SubscriptionService {

    SubscriptionResponse create(String userId, CreateSubscriptionRequest request);

    /**
     * Appelé après confirmation du paiement.
     * Active l'abonnement et met à jour le planType de l'utilisateur.
     */
    void activateAfterPayment(String paymentReference);

    SubscriptionResponse getCurrent(String userId);

    List<SubscriptionResponse> findAllByUser(String userId);

    List<SubscriptionPlanDto> getAvailablePlans();

    // ── Admin ─────────────────────────────────────────────────────────

    List<SubscriptionPlanDto> adminGetAllPlans();

    SubscriptionPlanDto adminCreatePlan(CreateSubscriptionPlanRequest request);

    SubscriptionPlanDto adminUpdatePlan(UUID planId, CreateSubscriptionPlanRequest request);

    void adminDeletePlan(UUID planId);

    SubscriptionPlanDto adminTogglePopular(UUID planId);
}
