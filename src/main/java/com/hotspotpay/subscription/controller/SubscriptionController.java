package com.hotspotpay.subscription.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.subscription.dto.CreateSubscriptionRequest;
import com.hotspotpay.subscription.dto.SubscriptionPlanDto;
import com.hotspotpay.subscription.dto.SubscriptionResponse;
import com.hotspotpay.subscription.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Abonnements", description = "Gestion des abonnements SaaS (BASIC, PRO, ENTERPRISE)")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Souscrire à un abonnement")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> create(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody CreateSubscriptionRequest request) {

        return ResponseEntity.ok(ApiResponse.ok(
                "Abonnement créé avec succès",
                subscriptionService.create(userId, request)));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Récupérer mon abonnement actuel")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getCurrent(
            @AuthenticationPrincipal String userId) {

        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.getCurrent(userId)));
    }

    @GetMapping("/me/history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Historique de mes abonnements")
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getHistory(
            @AuthenticationPrincipal String userId) {

        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.findAllByUser(userId)));
    }

    @GetMapping("/plans")
    @Operation(summary = "Liste des plans d'abonnement disponibles")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanDto>>> getPlans() {
        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.getAvailablePlans()));
    }
}