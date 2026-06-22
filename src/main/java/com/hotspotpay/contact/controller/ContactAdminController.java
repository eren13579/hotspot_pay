package com.hotspotpay.contact.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.contact.dto.AdminReplyRequest;
import com.hotspotpay.contact.dto.ContactResponse;
import com.hotspotpay.contact.dto.UpdateStatusRequest;
import com.hotspotpay.contact.service.ContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/admin/contact-messages")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Contact", description = "Gestion des messages de contact (tickets support)")
public class ContactAdminController {

    private final ContactService contactService;

    @GetMapping
    @Operation(summary = "Lister tous les messages de contact")
    public ResponseEntity<ApiResponse<Page<ContactResponse>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(ApiResponse.ok(
                contactService.adminList(status, search, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un message de contact")
    public ResponseEntity<ApiResponse<ContactResponse>> get(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(
                contactService.adminGet(id)));
    }

    @PutMapping("/{id}/reply")
    @Operation(summary = "Répondre à un message de contact")
    public ResponseEntity<ApiResponse<ContactResponse>> reply(
            @PathVariable UUID id,
            @Valid @RequestBody AdminReplyRequest request,
            @AuthenticationPrincipal String userId) {

        return ResponseEntity.ok(ApiResponse.ok(
                "Réponse envoyée avec succès",
                contactService.adminReply(id, request.getAdminReply(), UUID.fromString(userId))));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Marquer comme lu")
    public ResponseEntity<ApiResponse<ContactResponse>> markRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal String userId) {

        return ResponseEntity.ok(ApiResponse.ok(
                contactService.adminMarkRead(id, UUID.fromString(userId))));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Changer le statut d'un ticket")
    public ResponseEntity<ApiResponse<ContactResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal String userId) {

        return ResponseEntity.ok(ApiResponse.ok(
                "Statut mis à jour",
                contactService.adminUpdateStatus(id, request.getStatus(), UUID.fromString(userId))));
    }
}
