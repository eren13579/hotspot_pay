package com.hotspotpay.ticket.repository;

import com.hotspotpay.ticket.enumeration.TicketStatus;
import com.hotspotpay.ticket.model.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    Optional<Ticket> findByTicketId(String ticketId);

    /** Cherche un ticket par username sur un hotspot — utilisé par le portail captif */
    Optional<Ticket> findByHotspotIdAndUsername(String hotspotId, String username);

    /** Vérifie si ce username existe déjà sur ce hotspot (import dédoublonnage) */
    boolean existsByHotspotIdAndUsername(String hotspotId, String username);

    /** Tickets d'un hotspot paginés — dashboard propriétaire */
    Page<Ticket> findAllByHotspotIdOrderByCreatedAtDesc(String hotspotId, Pageable pageable);

    /** Tickets AVAILABLE d'un hotspot — pour affichage portail captif */
    Page<Ticket> findAllByHotspotIdAndStatusOrderByCreatedAtAsc(
            String hotspotId, TicketStatus status, Pageable pageable);

    /** Compteur par statut — dashboard */
    long countByHotspotIdAndStatus(String hotspotId, TicketStatus status);

    /** Nombre total de tickets d'un utilisateur (via l'utilisateur qui les a créés) */
    long countByUserId(String userId);

    /** Premier ticket AVAILABLE d'un hotspot — pour activation après paiement */
    Optional<Ticket> findFirstByHotspotIdAndStatusOrderByCreatedAtAsc(
            String hotspotId, TicketStatus status);

    /**
     * Sélectionne et verrouille le premier ticket AVAILABLE d'un hotspot.
     * Utilise SELECT FOR UPDATE pour empêcher deux paiements simultanés
     * de sélectionner le même ticket (race condition).
     * À appeler dans une méthode @Transactional.
     */
    @Query(value = """
            SELECT t.* FROM tickets t
            WHERE t.hotspot_id = :hotspotId
              AND t.status = :status
            ORDER BY t.created_at ASC
            LIMIT 1
            FOR UPDATE
            """, nativeQuery = true)
    Optional<Ticket> findFirstAvailableAndLock(
            @Param("hotspotId") String hotspotId,
            @Param("status") String status);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Ticket t SET t.status = :status, t.updatedAt = CURRENT_TIMESTAMP WHERE t.ticketId = :ticketId")
    void updateStatus(@Param("ticketId") String ticketId, @Param("status") TicketStatus status);
}
