package com.hotspotpay.realtime.controller;

import com.hotspotpay.realtime.service.SystemSseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
@Tag(name = "Temps réel système", description = "SSE broadcast pour événements système")
public class SystemSseController {

    private final SystemSseService systemSseService;

    @GetMapping(value = "/sse/system", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Flux SSE système (settings, FAQ, contact messages)")
    public SseEmitter streamSystemEvents() {
        return systemSseService.subscribe();
    }
}
