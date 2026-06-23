package com.hotspotpay.ticket.service;

import com.hotspotpay.ticket.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TicketService {

    /** Import de tickets depuis MikroTik — dédoublonnage par username */
    TicketImportResult importTickets(String userId, String hotspotId,
                                     TicketImportRequest request);

    /** Connexion portail captif via ticket — vérifie credentials et crée session */
    PortalTicketResponse connectWithTicket(String hotspotId, PortalTicketRequest request);

    /** Récupère les infos d'un ticket par username (portail captif localStorage) */
    PortalTicketResponse getTicketInfo(String hotspotId, String username);

    /** Dashboard — liste paginée des tickets d'un hotspot */
    Page<TicketResponse> findByHotspot(String userId, String hotspotId, Pageable pageable);

    /** Révoquer un ticket */
    void revoke(String userId, String hotspotId, String ticketId);

    /** Supprimer tous les tickets AVAILABLE/EXPIRED d'un hotspot */
    int deleteAll(String userId, String hotspotId);
}
