package com.hotspotpay.common.events;

import com.hotspotpay.payment.model.Payment;
import org.springframework.context.ApplicationEvent;

public class PaymentConfirmedEvent extends ApplicationEvent {

    private final Payment payment;

    public PaymentConfirmedEvent(Object source, Payment payment) {
        super(source);
        this.payment = payment;
    }

    public Payment getPayment() {
        return payment;
    }
}