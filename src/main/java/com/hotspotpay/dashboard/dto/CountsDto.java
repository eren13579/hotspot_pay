package com.hotspotpay.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class CountsDto {
    private long hotspotCount;
    private long ticketCount;
    private long planCount;
}
