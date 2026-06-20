package com.hotspotpay.users.controller;

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
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin — Utilisateurs", description = "Gestion des utilisateurs (ADMIN)")
public class AdminUserController {

    private final UserService userService;

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
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur mis à jour", userService.update(userId, request)));
    }

    @PostMapping
    @Operation(summary = "Créer un nouvel utilisateur")
    public ResponseEntity<ApiResponse<UserResponse>> create(
            @Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur créé", userService.create(request)));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "Désactiver un utilisateur (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String userId) {
        userService.delete(userId);
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur désactivé"));
    }
}