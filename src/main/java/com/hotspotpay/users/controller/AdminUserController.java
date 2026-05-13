package com.hotspotpay.users.controller;

import com.hotspotpay.common.dto.ApiResponse;
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
    @Operation(summary = "Lister tous les utilisateurs actifs (paginé)")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> findAll(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(userService.findAll(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "Rechercher un utilisateur (email, téléphone, nom)")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> search(
            @RequestParam String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(userService.search(q, pageable)));
    }

    @PutMapping("/{userId}")
    @Operation(summary = "Modifier un utilisateur")
    public ResponseEntity<ApiResponse<UserResponse>> update(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur mis à jour", userService.update(userId, request)));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "Désactiver un utilisateur (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String userId) {
        userService.delete(userId);
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur désactivé"));
    }
}