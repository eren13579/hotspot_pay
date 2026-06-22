package com.hotspotpay.faq.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class FaqResponse {
    private UUID id;
    private String question;
    private String answer;
    private String category;
    private int sortOrder;
    private boolean isActive;
}
