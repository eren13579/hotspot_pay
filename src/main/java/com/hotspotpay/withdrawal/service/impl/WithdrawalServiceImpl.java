package com.hotspotpay.withdrawal.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.dashboard.repository.DashboardRepository;
import com.hotspotpay.users.service.PlanLimitService;
import com.hotspotpay.withdrawal.dto.WithdrawalRequest;
import com.hotspotpay.withdrawal.dto.WithdrawalResponse;
import com.hotspotpay.withdrawal.enumeration.WithdrawalStatus;
import com.hotspotpay.withdrawal.model.Withdrawal;
import com.hotspotpay.withdrawal.repository.WithdrawalRepository;
import com.hotspotpay.withdrawal.service.WithdrawalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WithdrawalServiceImpl implements WithdrawalService {

    private final WithdrawalRepository withdrawalRepository;
    private final PlanLimitService     planLimitService;
    private final DashboardRepository  dashboardRepository;

    @Override
    @Transactional
    public WithdrawalResponse request(String userId, WithdrawalRequest req) {

        // ── Vérification limite plan ──────────────────────────────────────
        planLimitService.assertCanWithdraw(userId, req.getAmount());

        // Vérifier que le solde disponible est suffisant
        BigDecimal totalRevenue  = dashboardRepository.totalRevenue(userId);
        BigDecimal totalWithdrawn = withdrawalRepository.totalWithdrawn(userId);
        BigDecimal available     = totalRevenue.subtract(totalWithdrawn);

        if (req.getAmount().compareTo(available) > 0) {
            throw AppException.badRequest(String.format(
                    "Solde insuffisant. Disponible : %s XAF, Demandé : %s XAF",
                    available.toPlainString(), req.getAmount().toPlainString()));
        }

        String withdrawalId = "WIT_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Withdrawal withdrawal = Withdrawal.builder()
                .withdrawalId(withdrawalId)
                .userId(userId)
                .amount(req.getAmount())
                .recipientPhone(req.getRecipientPhone())
                .operator(req.getOperator())
                .status(WithdrawalStatus.PENDING)
                .build();

        withdrawalRepository.save(withdrawal);

        log.info("Demande de retrait créée: withdrawalId={}, userId={}, amount={} XAF",
                withdrawalId, userId, req.getAmount());

        // TODO : Intégrer API de disbursement Campay/Moneroo pour retrait automatique
        // Pour le MVP : retrait manuel traité par l'admin

        return toResponse(withdrawal, "Demande de retrait enregistrée. Traitement sous 24h ouvrables.");
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WithdrawalResponse> findAll(String userId, Pageable pageable) {
        return withdrawalRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(w -> toResponse(w, null));
    }

    @Override
    @Transactional(readOnly = true)
    public WithdrawalResponse findById(String userId, String withdrawalId) {
        Withdrawal w = getOwnedWithdrawal(userId, withdrawalId);
        return toResponse(w, null);
    }

    @Override
    @Transactional
    public void cancel(String userId, String withdrawalId) {
        Withdrawal w = getOwnedWithdrawal(userId, withdrawalId);
        if (w.getStatus() != WithdrawalStatus.PENDING) {
            throw AppException.badRequest("Seuls les retraits PENDING peuvent être annulés");
        }
        w.setStatus(WithdrawalStatus.CANCELLED);
        withdrawalRepository.save(w);
        log.info("Retrait annulé: withdrawalId={}", withdrawalId);
    }

    // ── Privé ─────────────────────────────────────────────────────────────

    private Withdrawal getOwnedWithdrawal(String userId, String withdrawalId) {
        return withdrawalRepository.findByWithdrawalId(withdrawalId)
                .filter(w -> w.getUserId().equals(userId))
                .orElseThrow(() -> AppException.notFound("Retrait introuvable ou accès refusé"));
    }

    private WithdrawalResponse toResponse(Withdrawal w, String message) {
        return WithdrawalResponse.builder()
                .withdrawalId(w.getWithdrawalId())
                .amount(w.getAmount())
                .currency(w.getCurrency())
                .recipientPhone(w.getRecipientPhone())
                .operator(w.getOperator())
                .status(w.getStatus())
                .gatewayRef(w.getGatewayRef())
                .processedAt(w.getProcessedAt())
                .createdAt(w.getCreatedAt())
                .message(message)
                .build();
    }
}
