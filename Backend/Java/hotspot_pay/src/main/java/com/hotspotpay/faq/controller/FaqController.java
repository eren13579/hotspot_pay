package com.hotspotpay.faq.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.faq.dto.FaqRequest;
import com.hotspotpay.faq.dto.FaqResponse;
import com.hotspotpay.faq.service.FaqService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/faqs")
@RequiredArgsConstructor
public class FaqController {

    private final FaqService faqService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, List<FaqResponse>>>> getPublicFaqs() {
        return ResponseEntity.ok(ApiResponse.ok("FAQ récupérées", faqService.getPublicFaqs()));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<FaqResponse>>> getAllFaqs() {
        return ResponseEntity.ok(ApiResponse.ok("Toutes les FAQs", faqService.getAllFaqs()));
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<FaqResponse>> createFaq(@Valid @RequestBody FaqRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("FAQ créée avec succès", faqService.createFaq(request)));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<FaqResponse>> updateFaq(
            @PathVariable UUID id,
            @Valid @RequestBody FaqRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("FAQ modifiée avec succès", faqService.updateFaq(id, request)));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteFaq(@PathVariable UUID id) {
        faqService.deleteFaq(id);
        return ResponseEntity.ok(ApiResponse.ok("FAQ supprimée avec succès"));
    }
}
