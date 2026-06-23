package com.hotspotpay.support.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.support.dto.ContactPublicRequest;
import com.hotspotpay.support.service.ContactMessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Contact public", description = "Formulaire de contact (page Landing)")
public class ContactPublicController {

    private final ContactMessageService contactMessageService;

    @PostMapping("/contact")
    @Operation(summary = "Soumettre un message de contact depuis la page d'accueil")
    public ResponseEntity<ApiResponse<Void>> submit(@Valid @RequestBody ContactPublicRequest request) {
        contactMessageService.createPublicMessage(request);
        log.info("Message de contact reçu de : {}", request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Message reçu avec succès. Nous vous répondrons rapidement."));
    }
}
