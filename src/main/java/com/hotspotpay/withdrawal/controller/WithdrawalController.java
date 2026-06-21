package com.hotspotpay.withdrawal.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.withdrawal.dto.WithdrawalRequest;
import com.hotspotpay.withdrawal.dto.WithdrawalResponse;
import java.util.List;
import java.util.Map;
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

    // ── Admin ─────────────────────────────────────────────────────────────────

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Lister tous les retraits (admin)")
    public ResponseEntity<ApiResponse<Page<WithdrawalResponse>>> findAllAdmin(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(withdrawalService.findAllAdmin(pageable)));
    }

    @PostMapping("/{withdrawalId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Approuver un retrait (admin)")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> approve(
            @PathVariable String withdrawalId) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Retrait approuvé",
                withdrawalService.approve(withdrawalId)));
    }

    @PostMapping("/{withdrawalId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Rejeter un retrait (admin)")
    public ResponseEntity<ApiResponse<WithdrawalResponse>> reject(
            @PathVariable String withdrawalId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "") : "";
        return ResponseEntity.ok(ApiResponse.ok(
                "Retrait rejeté",
                withdrawalService.reject(withdrawalId, reason)));
    }

    // ── Batch ─────────────────────────────────────────────────────────────────

    @PostMapping("/batch/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Approuver plusieurs retraits (admin)")
    public ResponseEntity<ApiResponse<List<WithdrawalResponse>>> batchApprove(
            @RequestBody Map<String, List<String>> body) {
        List<String> ids = body.get("withdrawalIds");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Liste d'IDs requise"));
        }
        return ResponseEntity.ok(ApiResponse.ok(
                ids.size() + " retrait(s) approuvé(s)",
                withdrawalService.batchApprove(ids)));
    }

    @PostMapping("/batch/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Rejeter plusieurs retraits (admin)")
    public ResponseEntity<ApiResponse<List<WithdrawalResponse>>> batchReject(
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("withdrawalIds");
        String reason = (String) body.getOrDefault("reason", "");
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Liste d'IDs requise"));
        }
        return ResponseEntity.ok(ApiResponse.ok(
                ids.size() + " retrait(s) rejeté(s)",
                withdrawalService.batchReject(ids, reason)));
    }
}
