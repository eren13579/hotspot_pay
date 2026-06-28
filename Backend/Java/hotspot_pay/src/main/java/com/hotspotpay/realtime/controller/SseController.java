package com.hotspotpay.realtime.controller;

import com.hotspotpay.realtime.service.SseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
@Tag(name = "Temps réel", description = "Server-Sent Events pour le statut paiement")
public class SseController {

    private final SseService sseService;

    /**
     * Le portail captif s'abonne à cet endpoint après l'initiation du paiement.
     * Dès que le webhook opérateur est reçu, le statut est poussé en temps réel.
     */
    @GetMapping(value = "/portal/payments/{reference}/stream",
                produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Stream SSE pour le statut d'un paiement")
    public SseEmitter streamPaymentStatus(@PathVariable String reference) {
        return sseService.subscribe(reference);
    }
}
