package com.hotspotpay.users.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.hotspot.repository.HotspotRepository;
import com.hotspotpay.users.dto.UpdateUserRequest;
import com.hotspotpay.users.dto.UserPlanInfoResponse;
import com.hotspotpay.users.dto.UserResponse;
import com.hotspotpay.users.model.User;
import com.hotspotpay.users.repository.UserRepository;
import com.hotspotpay.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Utilisateur", description = "Profil de l'utilisateur connecté")
public class UserController {

    private final UserService       userService;
    private final UserRepository    userRepository;
    private final HotspotRepository hotspotRepository;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Récupérer son propre profil")
    public ResponseEntity<ApiResponse<UserResponse>> getMe() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getMe()));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Modifier son propre profil")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Profil mis à jour", userService.updateMe(request)));
    }

    /**
     * Retourne le plan actuel de l'utilisateur + ses limites d'utilisation.
     * Utile pour afficher les restrictions dans le front (boutons désactivés, badges, etc.)
     */
    @GetMapping("/me/plan-info")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Limites et fonctionnalités du plan actuel")
    public ResponseEntity<ApiResponse<UserPlanInfoResponse>> getPlanInfo(
            @AuthenticationPrincipal String userId) {

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> com.hotspotpay.common.exception.AppException.notFound("Utilisateur introuvable"));

        int currentHotspots = (int) hotspotRepository.countByUserId(userId);
        UserPlanInfoResponse info = UserPlanInfoResponse.of(user.getPlanType(), currentHotspots);

        return ResponseEntity.ok(ApiResponse.ok(info));
    }
}
