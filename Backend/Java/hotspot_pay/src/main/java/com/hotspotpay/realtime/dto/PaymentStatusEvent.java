package com.hotspotpay.realtime.dto;

import com.hotspotpay.payment.enumeration.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusEvent {
    private String        reference;
    private PaymentStatus status;
    private String        message;
    private boolean       wifiActivated;
}
