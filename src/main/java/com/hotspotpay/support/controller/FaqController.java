package com.hotspotpay.support.controller;

import com.hotspotpay.audit.service.AuditService;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.support.dto.FaqRequest;
import com.hotspotpay.support.dto.FaqResponse;
import com.hotspotpay.support.service.FaqService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "FAQ", description = "Foire aux questions — publique et administration")
public class FaqController {

    private final FaqService faqService;
    private final AuditService auditService;

    // ── Publique ─────────────────────────────────────────────────────────────

    @GetMapping("/faqs")
    @Operation(summary = "Lister les FAQ actives (publique)")
    public ResponseEntity<ApiResponse<List<FaqResponse>>> getPublicFaqs() {
        return ResponseEntity.ok(ApiResponse.ok(faqService.getPublicFaqs()));
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    @GetMapping("/faqs/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Lister toutes les FAQ (admin)")
    public ResponseEntity<ApiResponse<List<FaqResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(faqService.findAll()));
    }

    @PostMapping("/faqs/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Créer une FAQ (admin)")
    public ResponseEntity<ApiResponse<FaqResponse>> create(
            @AuthenticationPrincipal String adminId,
            @Valid @RequestBody FaqRequest request) {
        var result = faqService.create(request);
        auditService.log("CREATE_FAQ", "Faq", result.getId(),
                "Admin " + adminId + " a créé la FAQ: " + request.getQuestion());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("FAQ créée", result));
    }

    @PutMapping("/faqs/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Modifier une FAQ (admin)")
    public ResponseEntity<ApiResponse<FaqResponse>> update(
            @AuthenticationPrincipal String adminId,
            @PathVariable String id,
            @Valid @RequestBody FaqRequest request) {
        var result = faqService.update(id, request);
        auditService.log("UPDATE_FAQ", "Faq", id,
                "Admin " + adminId + " a modifié la FAQ " + id);
        return ResponseEntity.ok(ApiResponse.ok("FAQ mise à jour", result));
    }

    @DeleteMapping("/faqs/admin/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Supprimer une FAQ (admin)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal String adminId,
            @PathVariable String id) {
        faqService.delete(id);
        auditService.log("DELETE_FAQ", "Faq", id,
                "Admin " + adminId + " a supprimé la FAQ " + id);
        return ResponseEntity.ok(ApiResponse.ok("FAQ supprimée"));
    }
}
