package com.hotspotpay.users.controller;

import com.hotspotpay.audit.service.AuditService;
import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.users.dto.CreateUserRequest;
import com.hotspotpay.users.dto.UpdateUserRequest;
import com.hotspotpay.users.dto.UserResponse;
import com.hotspotpay.users.service.UserService;
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

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin — Utilisateurs", description = "Gestion des utilisateurs (ADMIN)")
public class AdminUserController {

    private final UserService userService;
    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "Lister les utilisateurs (paginé, filtrable)")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> findAll(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String planType,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        if (active == null && role == null && planType == null) {
            return ResponseEntity.ok(ApiResponse.ok(userService.findAll(pageable)));
        }
        return ResponseEntity.ok(ApiResponse.ok(userService.findAll(active, role, planType, pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher un utilisateur (email, téléphone, nom)")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> search(
            @RequestParam String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(userService.search(q, pageable)));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Détail d'un utilisateur")
    public ResponseEntity<ApiResponse<UserResponse>> findById(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getById(userId)));
    }

    @PutMapping("/{userId}")
    @Operation(summary = "Modifier un utilisateur")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @AuthenticationPrincipal String adminId,
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse result = userService.update(userId, request);
        auditService.log("UPDATE_USER", "User", userId,
                "Admin " + adminId + " a modifié l'utilisateur " + userId);
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur mis à jour", result));
    }

    @PostMapping
    @Operation(summary = "Créer un nouvel utilisateur")
    public ResponseEntity<ApiResponse<UserResponse>> create(
            @AuthenticationPrincipal String adminId,
            @Valid @RequestBody CreateUserRequest request) {
        UserResponse result = userService.create(request);
        auditService.log("CREATE_USER", "User", result.getUserId(),
                "Admin " + adminId + " a créé l'utilisateur " + result.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur créé", result));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "Désactiver un utilisateur (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal String adminId,
            @PathVariable String userId) {
        userService.delete(userId);
        auditService.log("DEACTIVATE_USER", "User", userId,
                "Admin " + adminId + " a désactivé l'utilisateur " + userId);
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur désactivé"));
    }
}
