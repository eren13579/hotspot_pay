package com.hotspotpay.withdrawal.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.withdrawal.dto.WithdrawalRequest;
import com.hotspotpay.withdrawal.dto.WithdrawalResponse;
import com.hotspotpay.withdrawal.service.WithdrawalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/withdrawals")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Retraits", description = "Gestion des retraits de revenus")
public class WithdrawalController {

    private final WithdrawalService withdrawalService;

    @PostMapping
    @Operation(summary = "Demander un retrait")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> request(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody WithdrawalRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Demande de retrait enregistrée",
                        withdrawalService.request(userId, req)));
    }

    @GetMapping
    @Operation(summary = "Historique de mes retraits")
    public ResponseEntity<ApiResponse<Page<WithdrawalResponse>>> findAll(
            @AuthenticationPrincipal String userId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(withdrawalService.findAll(userId, pageable)));
    }

    @GetMapping("/{withdrawalId}")
    @Operation(summary = "Détail d'un retrait")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> findById(
            @AuthenticationPrincipal String userId,
            @PathVariable String withdrawalId) {
        return ResponseEntity.ok(ApiResponse.ok(withdrawalService.findById(userId, withdrawalId)));
    }

    @DeleteMapping("/{withdrawalId}")
    @Operation(summary = "Annuler un retrait PENDING")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @AuthenticationPrincipal String userId,
            @PathVariable String withdrawalId) {
        withdrawalService.cancel(userId, withdrawalId);
        return ResponseEntity.ok(ApiResponse.ok("Retrait annulé", null));
    }
}
