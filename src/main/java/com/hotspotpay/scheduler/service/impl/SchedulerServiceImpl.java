package com.hotspotpay.scheduler.service.impl;

import com.hotspotpay.payment.repository.PaymentRepository;
import com.hotspotpay.payment.enumeration.PaymentStatus;
import com.hotspotpay.session.service.SessionService;
import com.hotspotpay.hotspot.service.HotspotService;
import com.hotspotpay.subscription.service.SubscriptionService;
import com.hotspotpay.scheduler.service.SchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchedulerServiceImpl implements SchedulerService {

    private final SessionService sessionService;
    private final PaymentRepository paymentRepository;
    private final HotspotService hotspotService;
    private final SubscriptionService subscriptionService;

    @Override
    @Scheduled(fixedRate = 300000)
    public void scheduleSessionExpiryCheck() {
        log.debug("Running scheduled session expiry check");
        sessionService.expireTimedOutSessions();
    }

    @Override
    @Scheduled(fixedRate = 600000)
    public void schedulePaymentExpiryCheck() {
        log.debug("Running scheduled payment expiry check");
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);
        paymentRepository.findByStatusAndCreatedAtBefore(PaymentStatus.PENDING, cutoff)
                .forEach(p -> {
                    p.setStatus(PaymentStatus.EXPIRED);
                    paymentRepository.save(p);
                    log.info("Payment {} expired", p.getReference());
                });
    }

    @Override
    @Scheduled(cron = "0 0 1 1 * *")
    public void scheduleMonthlyQuotaReset() {
        log.info("Running scheduled monthly quota reset");
        subscriptionService.checkAndExpireSubscriptions();
    }

    @Override
    @Scheduled(fixedRate = 300000)
    public void scheduleHotspotHealthCheck() {
        log.debug("Running scheduled hotspot health check");
        hotspotService.checkAllHotspotHealth();
    }
}