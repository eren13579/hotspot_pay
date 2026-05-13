package com.hotspotpay.session.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.session.dto.SessionResponse;
import com.hotspotpay.session.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Sessions", description = "Gestion des sessions WiFi actives")
public class SessionController {

    private final SessionService sessionService;

    @GetMapping("/hotspot/{hotspotId}")
    @Operation(summary = "Lister les sessions d'un hotspot (paginé)")
    public ResponseEntity<ApiResponse<Page<SessionResponse>>> findByHotspot(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PageableDefault(size = 20, sort = "activatedAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(
                sessionService.findByHotspot(userId, hotspotId, pageable)));
    }

    @GetMapping("/{sessionId}")
    @Operation(summary = "Détail d'une session")
    public ResponseEntity<ApiResponse<SessionResponse>> findById(
            @AuthenticationPrincipal String userId,
            @PathVariable String sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(
                sessionService.findById(userId, sessionId)));
    }

    @PostMapping("/{sessionId}/revoke")
    @Operation(summary = "Révoquer une session (déconnexion forcée MikroTik)")
    public ResponseEntity<ApiResponse<Void>> revoke(
            @AuthenticationPrincipal String userId,
            @PathVariable String sessionId) {
        sessionService.revoke(userId, sessionId);
        return ResponseEntity.ok(ApiResponse.ok("Session révoquée — client déconnecté"));
    }
}