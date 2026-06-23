package com.hotspotpay.systemsettings.controller;

import com.hotspotpay.common.dto.ApiResponse;
import com.hotspotpay.common.service.FileStorageService;
import com.hotspotpay.systemsettings.dto.SystemSettingsResponse;
import com.hotspotpay.systemsettings.dto.SystemSettingsUpdateRequest;
import com.hotspotpay.systemsettings.service.AdminSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Admin — Paramètres système", description = "Configuration système réservée aux administrateurs")
public class AdminSettingsController {

    private final AdminSettingsService adminSettingsService;
    private final FileStorageService fileStorageService;

    @GetMapping
    @Operation(summary = "Lire les paramètres système")
    public ResponseEntity<ApiResponse<SystemSettingsResponse>> getSettings() {
        return ResponseEntity.ok(ApiResponse.ok(adminSettingsService.getSettings()));
    }

    @PutMapping
    @Operation(summary = "Modifier les paramètres système")
    public ResponseEntity<ApiResponse<SystemSettingsResponse>> updateSettings(
            @Valid @RequestBody SystemSettingsUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Paramètres système mis à jour", adminSettingsService.updateSettings(request)));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Uploader un fichier (logo, favicon, photo À propos)")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("section") String section
    ) {
        String subDir = switch (section) {
            case "logo" -> "logo";
            case "favicon" -> "favicon";
            case "about" -> "about";
            default -> "misc";
        };
        String publicUrl = fileStorageService.store(file, subDir);
        return ResponseEntity.ok(ApiResponse.ok(
                "Fichier uploadé avec succès",
                Map.of("url", publicUrl)
        ));
    }

    @DeleteMapping("/file")
    @Operation(summary = "Supprimer un fichier uploadé par son URL")
    public ResponseEntity<ApiResponse<Void>> deleteFile(@RequestParam String url) {
        fileStorageService.delete(url);
        return ResponseEntity.ok(ApiResponse.ok("Fichier supprimé"));
    }
}
