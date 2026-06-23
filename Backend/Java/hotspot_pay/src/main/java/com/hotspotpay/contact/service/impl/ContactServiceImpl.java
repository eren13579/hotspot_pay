package com.hotspotpay.contact.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.contact.dto.ContactRequest;
import com.hotspotpay.contact.dto.ContactResponse;
import com.hotspotpay.contact.model.ContactMessage;
import com.hotspotpay.contact.repository.ContactMessageRepository;
import com.hotspotpay.contact.service.ContactService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContactServiceImpl implements ContactService {

    private final ContactMessageRepository repository;

    @Override
    @Transactional
    public ContactResponse submit(ContactRequest request) {
        ContactMessage message = ContactMessage.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone().trim())
                .message(request.getMessage() != null ? request.getMessage().trim() : null)
                .status("OPEN")
                .build();

        message = repository.save(message);
        log.info("Nouveau message de contact de {} <{}>", message.getFullName(), message.getEmail());

        return toResponse(message);
    }

    // ── Admin methods ──────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<ContactResponse> adminList(String status, String search, Pageable pageable) {
        Specification<ContactMessage> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status.toUpperCase()));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("email")), pattern),
                        cb.like(cb.lower(root.get("phone")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return repository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ContactResponse adminGet(UUID id) {
        ContactMessage message = findById(id);
        return toResponse(message);
    }

    @Override
    @Transactional
    public ContactResponse adminReply(UUID id, String adminReply, UUID adminUserId) {
        ContactMessage message = findById(id);
        message.setAdminReply(adminReply);
        message.setHandledBy(adminUserId);
        message.setRead(true);
        if ("OPEN".equals(message.getStatus())) {
            message.setStatus("IN_PROGRESS");
        }
        message = repository.save(message);
        log.info("Admin {} a répondu au ticket {}", adminUserId, id);
        return toResponse(message);
    }

    @Override
    @Transactional
    public ContactResponse adminMarkRead(UUID id, UUID adminUserId) {
        ContactMessage message = findById(id);
        message.setRead(true);
        if ("OPEN".equals(message.getStatus())) {
            message.setStatus("IN_PROGRESS");
        }
        message.setHandledBy(adminUserId);
        message = repository.save(message);
        return toResponse(message);
    }

    @Override
    @Transactional
    public ContactResponse adminUpdateStatus(UUID id, String status, UUID adminUserId) {
        ContactMessage message = findById(id);
        message.setStatus(status.toUpperCase());
        message.setHandledBy(adminUserId);
        message = repository.save(message);
        log.info("Ticket {} status -> {} par admin {}", id, status, adminUserId);
        return toResponse(message);
    }

    private ContactMessage findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> AppException.notFound("Message de contact introuvable"));
    }

    private ContactResponse toResponse(ContactMessage m) {
        return ContactResponse.builder()
                .id(m.getId())
                .fullName(m.getFullName())
                .email(m.getEmail())
                .phone(m.getPhone())
                .message(m.getMessage())
                .isRead(m.isRead())
                .status(m.getStatus())
                .adminReply(m.getAdminReply())
                .handledBy(m.getHandledBy())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}
