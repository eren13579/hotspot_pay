package com.hotspotpay.support.controller;

import com.hotspotpay.audit.service.AuditService;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.support.dto.ContactMessageReplyRequest;
import com.hotspotpay.support.dto.ContactMessageResponse;
import com.hotspotpay.support.dto.ContactMessageStatusRequest;
import com.hotspotpay.support.service.ContactMessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/contact-messages")
@Tag(name = "Messages de contact", description = "Gestion des messages de contact (admin)")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class ContactMessageController {

    private final ContactMessageService contactMessageService;
    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "Lister les messages de contact")
    public ResponseEntity<ApiResponse<Page<ContactMessageResponse>>> list(
            @RequestParam(required = false) String status,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                contactMessageService.findAll(status, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un message de contact")
    public ResponseEntity<ApiResponse<ContactMessageResponse>> get(
            @PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(
                contactMessageService.findById(id)));
    }

    @PutMapping("/{id}/reply")
    @Operation(summary = "Répondre à un message")
    public ResponseEntity<ApiResponse<ContactMessageResponse>> reply(
            @AuthenticationPrincipal String adminId,
            @PathVariable String id,
            @Valid @RequestBody ContactMessageReplyRequest request) {
        var result = contactMessageService.reply(id, request.getAdminReply());
        auditService.log("REPLY_CONTACT", "ContactMessage", id,
                "Admin " + adminId + " a répondu au message de contact " + id);
        return ResponseEntity.ok(ApiResponse.ok("Réponse enregistrée", result));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Marquer un message comme lu")
    public ResponseEntity<ApiResponse<ContactMessageResponse>> markRead(
            @AuthenticationPrincipal String adminId,
            @PathVariable String id) {
        var result = contactMessageService.markRead(id);
        auditService.log("MARK_READ_CONTACT", "ContactMessage", id,
                "Admin " + adminId + " a marqué le message " + id + " comme lu");
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Changer le statut d'un message")
    public ResponseEntity<ApiResponse<ContactMessageResponse>> updateStatus(
            @AuthenticationPrincipal String adminId,
            @PathVariable String id,
            @Valid @RequestBody ContactMessageStatusRequest request) {
        var result = contactMessageService.updateStatus(id, request.getStatus());
        auditService.log("UPDATE_STATUS_CONTACT", "ContactMessage", id,
                "Admin " + adminId + " a changé le statut du message " + id + " en " + request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("Statut mis à jour", result));
    }
}
