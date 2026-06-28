package com.hotspotpay.support.service;

import com.hotspotpay.support.dto.ContactPublicRequest;
import com.hotspotpay.support.dto.ContactMessageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ContactMessageService {

    /** Lister les messages (admin) */
    Page<ContactMessageResponse> findAll(String status, Pageable pageable);

    /** Détail d'un message (admin) */
    ContactMessageResponse findById(String id);

    /** Répondre à un message (admin) */
    ContactMessageResponse reply(String id, String adminReply);

    /** Marquer comme lu (admin) */
    ContactMessageResponse markRead(String id);

    /** Changer le statut (admin) */
    ContactMessageResponse updateStatus(String id, String status);

    /** Compter les messages non lus */
    long countUnread();

    /** Créer un message depuis le formulaire public */
    void createPublicMessage(ContactPublicRequest request);
}
