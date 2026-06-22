package com.hotspotpay.contact.service;

import com.hotspotpay.contact.dto.ContactRequest;
import com.hotspotpay.contact.dto.ContactResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ContactService {
    ContactResponse submit(ContactRequest request);

    // ── Admin methods ──────────────────────────────────────────
    Page<ContactResponse> adminList(String status, String search, Pageable pageable);
    ContactResponse adminGet(UUID id);
    ContactResponse adminReply(UUID id, String adminReply, UUID adminUserId);
    ContactResponse adminMarkRead(UUID id, UUID adminUserId);
    ContactResponse adminUpdateStatus(UUID id, String status, UUID adminUserId);
}
