package com.hotspotpay.common.events;

import com.hotspotpay.payment.model.Payment;
import org.springframework.context.ApplicationEvent;

public class PaymentFailedEvent extends ApplicationEvent {

    private final Payment payment;
    private final String reason;

    public PaymentFailedEvent(Object source, Payment payment, String reason) {
        super(source);
        this.payment = payment;
        this.reason = reason;
    }

    public Payment getPayment() { return payment; }
    public String getReason() { return reason; }
}