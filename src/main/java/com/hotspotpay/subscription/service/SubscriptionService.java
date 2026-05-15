package com.hotspotpay.subscription.service;

import com.hotspotpay.subscription.dto.CreateSubscriptionRequest;
import com.hotspotpay.subscription.dto.SubscriptionPlanDto;
import com.hotspotpay.subscription.dto.SubscriptionResponse;

import java.util.List;

public interface SubscriptionService {

    SubscriptionResponse create(String userId, CreateSubscriptionRequest request);

    SubscriptionResponse getCurrent(String userId);

    List<SubscriptionResponse> findAllByUser(String userId);

    List<SubscriptionPlanDto> getAvailablePlans();

    void checkAndExpireSubscriptions();
}