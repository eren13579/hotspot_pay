package com.hotspotpay.contact.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ContactResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private String message;
    private boolean isRead;
    private String status;
    private String adminReply;
    private UUID handledBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
