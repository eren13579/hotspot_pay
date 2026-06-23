package com.hotspotpay.ticket.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.router.service.FastApiTicketCrudClient;
import com.hotspotpay.ticket.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Tickets WiFi", description = "Import et gestion des tickets MikroTik (proxy FastAPI)")
public class TicketController {

    private final FastApiTicketCrudClient fastApiTicketCrudClient;

    // ── Dashboard propriétaire (JWT requis, proxy FastAPI) ──────────────────

    @PostMapping("/hotspots/{hotspotId}/tickets/import")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Importer des tickets depuis MikroTik")
    public ResponseEntity<ApiResponse<JsonNode>> importTickets(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @Valid @RequestBody TicketImportRequest request) {

        // Build body with camelCase fields matching FastAPI CamelBase
        Map<String, Object> body = new HashMap<>();
        body.put("hotspotId", hotspotId);
        List<Map<String, Object>> tickets = new ArrayList<>();
        for (TicketImportRequest.TicketItem item : request.getTickets()) {
            Map<String, Object> t = new HashMap<>();
            t.put("username", item.getUsername());
            t.put("password", item.getPassword());
            if (item.getProfile() != null) t.put("profile", item.getProfile());
            if (item.getTimeLimit() != null) t.put("timeLimit", item.getTimeLimit());
            if (item.getDataLimit() != null) t.put("dataLimit", item.getDataLimit());
            if (item.getComment() != null) t.put("comment", item.getComment());
            tickets.add(t);
        }
        body.put("tickets", tickets);

        JsonNode result = fastApiTicketCrudClient.importTickets(body);
        if (result == null) {
            throw AppException.internalError("Erreur lors de l'import des tickets (FastAPI)");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/hotspots/{hotspotId}/tickets")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Lister les tickets d'un hotspot")
    public ResponseEntity<ApiResponse<JsonNode>> findByHotspot(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {

        JsonNode result = fastApiTicketCrudClient.listByHotspot(hotspotId);
        if (result == null) {
            throw AppException.internalError("Erreur lors du chargement des tickets (FastAPI)");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @DeleteMapping("/hotspots/{hotspotId}/tickets/{ticketId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Révoquer un ticket")
    public ResponseEntity<ApiResponse<JsonNode>> revoke(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PathVariable String ticketId) {

        JsonNode result = fastApiTicketCrudClient.revoke(ticketId);
        if (result == null) {
            throw AppException.notFound("Ticket introuvable ou accès non autorisé");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @DeleteMapping("/hotspots/{hotspotId}/tickets/{ticketId}/delete")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Supprimer définitivement un ticket révoqué")
    public ResponseEntity<ApiResponse<JsonNode>> deleteOne(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @PathVariable String ticketId) {

        boolean ok = fastApiTicketCrudClient.deleteByTicketId(ticketId);
        if (!ok) {
            throw AppException.notFound("Ticket introuvable");
        }
        var data = new ObjectMapper().createObjectNode()
                .put("ticket_id", ticketId)
                .put("deleted", true);
        return ResponseEntity.ok(ApiResponse.ok("Ticket supprimé", data));
    }

    @DeleteMapping("/hotspots/{hotspotId}/tickets")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Supprimer tous les tickets d'un hotspot")
    public ResponseEntity<ApiResponse<JsonNode>> deleteAll(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId) {

        JsonNode result = fastApiTicketCrudClient.deleteAllByHotspot(hotspotId);
        if (result == null) {
            throw AppException.internalError("Erreur lors de la suppression (FastAPI)");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    // ── Portail captif (public — pas de JWT, proxy FastAPI) ──────────────────

    @PostMapping("/portal/{hotspotId}/tickets/connect")
    @Operation(summary = "Se connecter avec un ticket WiFi (portail captif)")
    public ResponseEntity<ApiResponse<JsonNode>> connectWithTicket(
            @PathVariable String hotspotId,
            @Valid @RequestBody PortalTicketRequest request) {

        JsonNode result = fastApiTicketCrudClient.portalConnect(
                hotspotId, request.getUsername(), request.getPassword(),
                request.getMac(), request.getPhone());
        if (result == null) {
            throw AppException.internalError("Erreur de connexion via le portail captif");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }

    @GetMapping("/portal/{hotspotId}/tickets/{username}/info")
    @Operation(summary = "Obtenir les infos d'un ticket (portail captif)")
    public ResponseEntity<ApiResponse<JsonNode>> getTicketInfo(
            @PathVariable String hotspotId,
            @PathVariable String username) {

        JsonNode result = fastApiTicketCrudClient.getPortalTicketInfo(hotspotId, username);
        if (result == null) {
            throw AppException.notFound("Ticket introuvable");
        }
        return ResponseEntity.ok(ApiResponse.okFromFastApi(result));
    }
}
