package com.hotspotpay.support.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.realtime.service.SystemSseService;
import com.hotspotpay.support.dto.ContactMessageResponse;
import com.hotspotpay.support.dto.ContactPublicRequest;
import com.hotspotpay.support.entity.ContactMessage;
import com.hotspotpay.support.repository.ContactMessageRepository;
import com.hotspotpay.support.service.ContactMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContactMessageServiceImpl implements ContactMessageService {

    private static final Set<String> VALID_STATUSES = Set.of("pending", "read", "replied", "closed");

    private final ContactMessageRepository repository;
    private final SystemSseService systemSseService;

    @Override
    @Transactional(readOnly = true)
    public Page<ContactMessageResponse> findAll(String status, Pageable pageable) {
        Page<ContactMessage> page;
        if (status != null && !status.isBlank()) {
            page = repository.findByStatusOrderByCreatedAtDesc(status, pageable);
        } else {
            page = repository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ContactMessageResponse findById(String id) {
        return toResponse(findEntity(id));
    }

    @Override
    @Transactional
    public ContactMessageResponse reply(String id, String adminReply) {
        ContactMessage msg = findEntity(id);
        msg.setAdminReply(adminReply);
        msg.setStatus("replied");
        ContactMessage saved = repository.save(msg);
        log.info("Message {} répondu par admin", id);
        systemSseService.broadcast("contact_updated", "replied:" + id);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ContactMessageResponse markRead(String id) {
        ContactMessage msg = findEntity(id);
        if ("pending".equals(msg.getStatus())) {
            msg.setStatus("read");
            repository.save(msg);
            systemSseService.broadcast("contact_updated", "read:" + id);
        }
        return toResponse(msg);
    }

    @Override
    @Transactional
    public ContactMessageResponse updateStatus(String id, String status) {
        if (!VALID_STATUSES.contains(status)) {
            throw AppException.badRequest("Statut invalide : " + status
                    + ". Valeurs acceptées : " + String.join(", ", VALID_STATUSES));
        }
        ContactMessage msg = findEntity(id);
        msg.setStatus(status);
        ContactMessage saved = repository.save(msg);
        log.info("Message {} statut → {}", id, status);
        systemSseService.broadcast("contact_updated", status + ":" + id);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread() {
        return repository.countByStatus("pending");
    }

    @Override
    @Transactional
    public void createPublicMessage(ContactPublicRequest request) {
        // Le frontend n'envoie pas de subject → auto-généré depuis le message
        String subject = request.getMessage() != null && !request.getMessage().isBlank()
                ? request.getMessage().substring(0, Math.min(request.getMessage().length(), 100))
                : "Message depuis le site web";

        ContactMessage msg = ContactMessage.builder()
                .name(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone() != null ? request.getPhone() : "")
                .subject(subject)
                .message(request.getMessage())
                .status("pending")
                .build();

        repository.save(msg);
        log.info("Nouveau message de contact : {} <{}>", request.getFullName(), request.getEmail());
        systemSseService.broadcast("contact_updated", "new:" + msg.getId());
    }

    private ContactMessage findEntity(String id) {
        return repository.findById(java.util.UUID.fromString(id))
                .orElseThrow(() -> AppException.notFound("Message de contact introuvable : " + id));
    }

    private ContactMessageResponse toResponse(ContactMessage cm) {
        return ContactMessageResponse.builder()
                .id(cm.getId().toString())
                .name(cm.getName())
                .email(cm.getEmail())
                .subject(cm.getSubject())
                .message(cm.getMessage())
                .adminReply(cm.getAdminReply())
                .status(cm.getStatus())
                .createdAt(cm.getCreatedAt())
                .build();
    }
}
