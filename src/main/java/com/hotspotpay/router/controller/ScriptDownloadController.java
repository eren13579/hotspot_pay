package com.hotspotpay.router.controller;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.router.service.FastApiClient;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/script-download")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Script Download", description = "Proxy vers FastAPI pour télécharger le script routeur")
public class ScriptDownloadController {

    private final FastApiClient fastApiClient;

    @GetMapping("/{hotspotId}")
    @Operation(summary = "Télécharger le script routeur pré-configuré")
    public ResponseEntity<byte[]> downloadScript(
            @AuthenticationPrincipal String userId,
            @PathVariable String hotspotId,
            @RequestParam String token,
            @RequestParam(defaultValue = "mikrotik") String brand,
            @RequestParam(defaultValue = "bash") String format) {

        String script = fastApiClient.downloadRouterScript(hotspotId, token, brand, format);
        if (script == null) {
            throw AppException.internalError("Erreur lors du téléchargement du script (FastAPI)");
        }

        String ext = "bash".equals(format) ? "sh" : "rsc";
        String filename = String.format("hotspotpay-%s-%s.%s", brand, hotspotId.substring(0, 8), ext);

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(script.getBytes(StandardCharsets.UTF_8));
    }
}
