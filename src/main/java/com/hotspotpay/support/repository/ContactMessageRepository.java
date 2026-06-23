package com.hotspotpay.support.repository;

import com.hotspotpay.support.entity.ContactMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, UUID> {

    /** Messages paginés triés par date (plus récent d'abord) */
    Page<ContactMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Messages filtrés par statut */
    Page<ContactMessage> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    /** Compter par statut */
    long countByStatus(String status);
}
