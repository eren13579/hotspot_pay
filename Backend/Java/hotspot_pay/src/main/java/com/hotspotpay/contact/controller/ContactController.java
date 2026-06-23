package com.hotspotpay.contact.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.contact.dto.ContactRequest;
import com.hotspotpay.contact.dto.ContactResponse;
import com.hotspotpay.contact.service.ContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/contact")
@RequiredArgsConstructor
@Tag(name = "Contact", description = "Formulaire de contact public")
public class ContactController {

    private final ContactService contactService;

    @PostMapping
    @Operation(summary = "Soumettre un message de contact (public)")
    public ResponseEntity<ApiResponse<ContactResponse>> submit(
            @Valid @RequestBody ContactRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Message envoyé avec succès",
                        contactService.submit(request)));
    }
}
