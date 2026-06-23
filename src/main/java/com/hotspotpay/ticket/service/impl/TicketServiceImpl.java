package com.hotspotpay.ticket.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.hotspot.repository.HotspotRepository;
import com.hotspotpay.realtime.service.SystemSseService;
import com.hotspotpay.session.enumeration.SessionStatus;
import com.hotspotpay.session.model.Session;
import com.hotspotpay.session.repository.SessionRepository;
import com.hotspotpay.router.service.FastApiTicketClient;
import com.hotspotpay.router.dto.RouterActionPayload;
import com.hotspotpay.router.enumeration.RouterActionType;
import com.hotspotpay.router.service.RouterActionService;
import com.hotspotpay.ticket.dto.*;
import com.hotspotpay.ticket.enumeration.TicketStatus;
import com.hotspotpay.ticket.model.Ticket;
import com.hotspotpay.ticket.repository.TicketRepository;
import com.hotspotpay.ticket.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository     ticketRepository;
    private final HotspotRepository    hotspotRepository;
    private final SessionRepository    sessionRepository;
    private final FastApiTicketClient   fastApiTicketClient;
    private final RouterActionService  routerActionService;
    private final SystemSseService     systemSseService;

    // ── Import ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TicketImportResult importTickets(String userId, String hotspotId,
                                             TicketImportRequest request) {
        hotspotRepository.findByHotspotIdAndUserId(hotspotId, userId)
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable ou accès refusé"));

        int imported = 0;
        List<String> skipped = new ArrayList<>();

        for (TicketImportRequest.TicketItem item : request.getTickets()) {
            if (ticketRepository.existsByHotspotIdAndUsername(hotspotId, item.getUsername())) {
                skipped.add(item.getUsername());
                continue;
            }
            Ticket ticket = Ticket.builder()
                    .ticketId("tkt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12))
                    .hotspotId(hotspotId)
                    .userId(userId)
                    .username(item.getUsername())
                    .password(item.getPassword())
                    .profile(item.getProfile() != null ? item.getProfile() : "default")
                    .comment(item.getComment())
                    .uptimeLimit(item.getTimeLimit())
                    .dataLimit(item.getDataLimit() != null ? item.getDataLimit().toString() : null)
                    .status(TicketStatus.AVAILABLE)
                    .build();
            ticketRepository.save(ticket);
            imported++;
        }

        systemSseService.broadcast("ticket_updated", "imported:" + hotspotId + ":" + imported);

        log.info("Import tickets hotspot={}: {}/{} importés, {} doublons",
                hotspotId, imported, request.getTickets().size(), skipped.size());

        return TicketImportResult.builder()
                .total(request.getTickets().size())
                .imported(imported)
                .skipped(skipped.size())
                .skippedUsernames(skipped.isEmpty() ? null : skipped)
                .message(imported + " ticket(s) importé(s)" +
                        (skipped.isEmpty() ? "" : ", " + skipped.size() + " doublon(s) ignoré(s)"))
                .build();
    }

    // ── Connexion portail captif avec ticket ──────────────────────────────

    @Override
    @Transactional
    public PortalTicketResponse connectWithTicket(String hotspotId,
                                                   PortalTicketRequest request) {
        Ticket ticket = ticketRepository.findByHotspotIdAndUsername(hotspotId, request.getUsername())
                .orElseThrow(() -> AppException.notFound(
                        "Ticket introuvable — vérifiez votre username"));

        // Vérifier le password
        if (!ticket.getPassword().equals(request.getPassword())) {
            throw AppException.forbidden("Password incorrect");
        }

        // Si déjà une session active avec ce ticket → retourner les infos existantes
        if (ticket.getStatus() == TicketStatus.USED && ticket.getSessionId() != null) {
            return sessionRepository.findBySessionId(ticket.getSessionId())
                    .map(session -> buildPortalResponse(ticket, session, false))
                    .orElseGet(() -> buildPortalResponse(ticket, null, false));
        }

        if (ticket.getStatus() == TicketStatus.REVOKED) {
            return PortalTicketResponse.builder()
                    .success(false)
                    .message("Ce ticket a été révoqué.")
                    .ticketStatus(ticket.getStatus().name())
                    .build();
        }

        if (ticket.getStatus() == TicketStatus.EXPIRED) {
            return PortalTicketResponse.builder()
                    .success(false)
                    .message("Ce ticket a expiré.")
                    .expired(true)
                    .ticketStatus(ticket.getStatus().name())
                    .username(ticket.getUsername())
                    .build();
        }

        // ── Créer la session PENDING_MIKROTIK ─────────────────────────
        String sessionId = UUID.randomUUID().toString();
        int durationMinutes = parseUptimeToMinutes(ticket.getUptimeLimit());

        Session session = Session.builder()
                .sessionId(sessionId)
                .hotspotId(hotspotId)
                .planId("TICKET_" + ticket.getTicketId())
                .clientPhone(request.getPhone())
                .clientMac(request.getMac() != null ? request.getMac().toUpperCase() : null)
                .mikrotikUsername(ticket.getUsername())
                .mikrotikPassword(ticket.getPassword())
                .status(SessionStatus.PENDING_MIKROTIK)
                .activatedAt(LocalDateTime.now())
                .expiresAt(durationMinutes > 0
                        ? LocalDateTime.now().plusMinutes(durationMinutes)
                        : LocalDateTime.now().plusYears(1))
                .build();
        sessionRepository.save(session);

        // Marquer le ticket USED
        ticket.setStatus(TicketStatus.USED);
        ticket.setSessionId(sessionId);
        ticket.setClientMac(request.getMac() != null ? request.getMac().toUpperCase() : null);
        ticket.setClientPhone(request.getPhone());
        ticket.setUsedAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        // Activer le ticket via FastAPI → crée l'action CREATE_USER pour le routeur MikroTik
        // Le routeur récupérera cette action via Long Polling et créera l'utilisateur HotSpot
        try {
            fastApiTicketClient.activateTicket(hotspotId, ticket);
        } catch (Exception e) {
            log.warn("FastAPI: Échec activation ticket via FastAPI (le routeur réessayera): {}",
                    e.getMessage());
        }

        log.info("Ticket utilisé: username={} hotspot={} session={}",
                ticket.getUsername(), hotspotId, sessionId);

        return buildPortalResponse(ticket, session, false);
    }

    // ── Info ticket (localStorage refresh) ───────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PortalTicketResponse getTicketInfo(String hotspotId, String username) {
        Ticket ticket = ticketRepository.findByHotspotIdAndUsername(hotspotId, username)
                .orElseThrow(() -> AppException.notFound("Ticket introuvable"));

        Session session = null;
        if (ticket.getSessionId() != null) {
            session = sessionRepository.findBySessionId(ticket.getSessionId()).orElse(null);
        }

        boolean expired = session != null && session.getExpiresAt() != null
                && session.getExpiresAt().isBefore(LocalDateTime.now());

        return buildPortalResponse(ticket, session, expired);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponse> findByHotspot(String userId, String hotspotId,
                                               Pageable pageable) {
        hotspotRepository.findByHotspotIdAndUserId(hotspotId, userId)
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable ou accès refusé"));
        return ticketRepository.findAllByHotspotIdOrderByCreatedAtDesc(hotspotId, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional
    public void revoke(String userId, String hotspotId, String ticketId) {
        hotspotRepository.findByHotspotIdAndUserId(hotspotId, userId)
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable ou accès refusé"));

        Ticket ticket = ticketRepository.findByTicketId(ticketId)
                .filter(t -> t.getHotspotId().equals(hotspotId))
                .orElseThrow(() -> AppException.notFound("Ticket introuvable"));

        ticket.setStatus(TicketStatus.REVOKED);
        ticketRepository.save(ticket);

        // Si session active → créer une action REMOVE_USER sur le routeur MikroTik
        if (ticket.getSessionId() != null) {
            sessionRepository.findBySessionId(ticket.getSessionId()).ifPresent(session -> {
                if (session.getStatus() == SessionStatus.ACTIVE) {
                    RouterActionPayload payload = RouterActionPayload.builder()
                            .username(ticket.getUsername())
                            .comment("REVOKE:" + ticket.getTicketId())
                            .build();
                    String actionId = routerActionService.createAction(
                            hotspotId, RouterActionType.REMOVE_USER, payload, ticket.getSessionId());
                    if (actionId != null) {
                        log.info("Action REMOVE_USER envoyée pour ticket révoqué: ticketId={} actionId={}",
                                ticketId, actionId);
                    } else {
                        log.warn("Échec envoi action REMOVE_USER pour ticket révoqué: ticketId={}", ticketId);
                    }
                }
            });
        }

        systemSseService.broadcast("ticket_updated", "revoked:" + ticketId);

        log.info("Ticket révoqué: ticketId={}", ticketId);
    }

    @Override
    @Transactional
    public int deleteAll(String userId, String hotspotId) {
        hotspotRepository.findByHotspotIdAndUserId(hotspotId, userId)
                .orElseThrow(() -> AppException.notFound("Hotspot introuvable ou accès refusé"));
        Page<Ticket> all = ticketRepository
                .findAllByHotspotIdOrderByCreatedAtDesc(hotspotId, Pageable.unpaged());
        ticketRepository.deleteAll(all.getContent());
        return all.getNumberOfElements();
    }

    // ── Privé ─────────────────────────────────────────────────────────────

    private PortalTicketResponse buildPortalResponse(Ticket ticket, Session session,
                                                       boolean expired) {
        String durationLabel = "";
        if (session != null && session.getExpiresAt() != null) {
            long mins = ChronoUnit.MINUTES.between(LocalDateTime.now(), session.getExpiresAt());
            if (expired || mins <= 0) {
                durationLabel = "Expirée";
            } else if (mins < 60) {
                durationLabel = mins + " min restante(s)";
            } else {
                durationLabel = (mins / 60) + "h" + (mins % 60 > 0 ? (mins % 60) + "min" : "") + " restante(s)";
            }
        }

        boolean sessionExpired = expired ||
                (session != null && session.getStatus() == SessionStatus.EXPIRED);

        return PortalTicketResponse.builder()
                .success(true)
                .message(sessionExpired
                        ? "Votre session a expiré."
                        : "Connexion active — votre WiFi fonctionne.")
                .username(ticket.getUsername())
                .password(ticket.getPassword())
                .profile(ticket.getProfile())
                .uptimeLimit(ticket.getUptimeLimit())
                .sessionId(ticket.getSessionId())
                .activatedAt(session != null ? session.getActivatedAt() : null)
                .expiresAt(session != null ? session.getExpiresAt() : null)
                .durationLabel(durationLabel)
                .expired(sessionExpired)
                .ticketStatus(ticket.getStatus().name())
                .build();
    }

    private TicketResponse toResponse(Ticket t) {
        return TicketResponse.builder()
                .ticketId(t.getTicketId())
                .hotspotId(t.getHotspotId())
                .username(t.getUsername())
                .password(t.getPassword())
                .profile(t.getProfile())
                .comment(t.getComment())
                .uptimeLimit(t.getUptimeLimit())
                .dataLimit(t.getDataLimit())
                .status(t.getStatus())
                .clientMac(t.getClientMac())
                .usedAt(t.getUsedAt())
                .expiresAt(t.getExpiresAt())
                .createdAt(t.getCreatedAt())
                .build();
    }

    /**
     * Convertit un uptime MikroTik en minutes.
     * Formats supportés :
     *   - "DD:HH:MM:SS" (ex: "1:02:30:00" = 1j 2h 30min)
     *   - "HH:MM:SS"   (ex: "02:30:00" = 2h 30min)
     *   - "H:MM:SS"    (ex: "2:30:00")
     *   - "Xh"          (ex: "2h")
     *   - "Xm"          (ex: "120m")
     * Retourne 0 si illimité ou format inconnu.
     */
    int parseUptimeToMinutes(String uptime) {
        if (uptime == null || uptime.isBlank()) return 0;
        try {
            if (uptime.contains(":")) {
                String[] parts = uptime.split(":");
                if (parts.length == 4) {
                    // DD:HH:MM:SS
                    int d = Integer.parseInt(parts[0].trim());
                    int h = Integer.parseInt(parts[1].trim());
                    int m = Integer.parseInt(parts[2].trim());
                    return d * 1440 + h * 60 + m;
                } else if (parts.length == 3) {
                    // HH:MM:SS
                    int h = Integer.parseInt(parts[0].trim());
                    int m = Integer.parseInt(parts[1].trim());
                    return h * 60 + m;
                } else if (parts.length == 2) {
                    // H:MM (cas rare)
                    int h = Integer.parseInt(parts[0].trim());
                    int m = Integer.parseInt(parts[1].trim());
                    return h * 60 + m;
                }
            }
            // Format simple "2h" ou "120m"
            String trimmed = uptime.trim();
            if (trimmed.endsWith("h")) return Integer.parseInt(trimmed.replace("h", "").trim()) * 60;
            if (trimmed.endsWith("m")) return Integer.parseInt(trimmed.replace("m", "").trim());
        } catch (NumberFormatException e) {
            log.warn("Format uptime non reconnu: '{}' — ignoré", uptime);
        }
        return 0;
    }
}
