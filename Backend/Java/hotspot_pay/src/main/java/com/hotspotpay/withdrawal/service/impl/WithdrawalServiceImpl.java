package com.hotspotpay.withdrawal.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.dashboard.repository.DashboardRepository;
import com.hotspotpay.realtime.service.SystemSseService;
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
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WithdrawalServiceImpl implements WithdrawalService {

    private final WithdrawalRepository withdrawalRepository;
    private final PlanLimitService     planLimitService;
    private final DashboardRepository  dashboardRepository;
    private final SystemSseService     systemSseService;

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

        systemSseService.broadcast("withdrawal_updated", "new:" + withdrawalId);

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

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN
    // ═══════════════════════════════════════════════════════════════════════

    @Override
    @Transactional(readOnly = true)
    public Page<WithdrawalResponse> findAllAdmin(Pageable pageable) {
        return withdrawalRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(w -> toResponse(w, null));
    }

    @Override
    @Transactional
    public WithdrawalResponse approve(String withdrawalId) {
        Withdrawal w = withdrawalRepository.findByWithdrawalId(withdrawalId)
                .orElseThrow(() -> AppException.notFound("Retrait introuvable"));

        if (w.getStatus() != WithdrawalStatus.PENDING) {
            throw AppException.badRequest("Seuls les retraits PENDING peuvent être approuvés");
        }

        w.setStatus(WithdrawalStatus.COMPLETED);
        w.setProcessedAt(LocalDateTime.now());
        withdrawalRepository.save(w);

        log.info("Retrait approuvé par admin: withdrawalId={}, amount={} XAF",
                withdrawalId, w.getAmount());

        systemSseService.broadcast("withdrawal_updated", "approved:" + withdrawalId);

        return toResponse(w, "Retrait approuvé et traité avec succès");
    }

    @Override
    @Transactional
    public WithdrawalResponse reject(String withdrawalId, String reason) {
        Withdrawal w = withdrawalRepository.findByWithdrawalId(withdrawalId)
                .orElseThrow(() -> AppException.notFound("Retrait introuvable"));

        if (w.getStatus() != WithdrawalStatus.PENDING) {
            throw AppException.badRequest("Seuls les retraits PENDING peuvent être rejetés");
        }

        w.setStatus(WithdrawalStatus.FAILED);
        w.setFailureReason(reason != null && !reason.isBlank() ? reason : "Rejeté par l'administration");
        w.setProcessedAt(LocalDateTime.now());
        withdrawalRepository.save(w);

        log.info("Retrait rejeté par admin: withdrawalId={}, reason={}", withdrawalId, w.getFailureReason());

        systemSseService.broadcast("withdrawal_updated", "rejected:" + withdrawalId);

        return toResponse(w, "Retrait rejeté");
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BATCH ADMIN
    // ═══════════════════════════════════════════════════════════════════════

    @Override
    @Transactional
    public List<WithdrawalResponse> batchApprove(List<String> withdrawalIds) {
        List<Withdrawal> withdrawals = withdrawalRepository.findAllPendingByIds(withdrawalIds);
        if (withdrawals.isEmpty()) {
            throw AppException.notFound("Aucun retrait PENDING trouvé parmi les IDs fournis");
        }
        List<WithdrawalResponse> results = withdrawals.stream().map(w -> {
            w.setStatus(WithdrawalStatus.COMPLETED);
            w.setProcessedAt(LocalDateTime.now());
            withdrawalRepository.save(w);
            log.info("Retrait approuvé (batch): withdrawalId={}, amount={} XAF", w.getWithdrawalId(), w.getAmount());
            return toResponse(w, "Retrait approuvé avec succès");
        }).collect(Collectors.toList());
        systemSseService.broadcast("withdrawal_updated", "batch_approved:" + String.join(",", withdrawalIds));
        return results;
    }

    @Override
    @Transactional
    public List<WithdrawalResponse> batchReject(List<String> withdrawalIds, String reason) {
        List<Withdrawal> withdrawals = withdrawalRepository.findAllPendingByIds(withdrawalIds);
        if (withdrawals.isEmpty()) {
            throw AppException.notFound("Aucun retrait PENDING trouvé parmi les IDs fournis");
        }
        String failReason = reason != null && !reason.isBlank() ? reason : "Rejeté par l'administration";
        List<WithdrawalResponse> results = withdrawals.stream().map(w -> {
            w.setStatus(WithdrawalStatus.FAILED);
            w.setFailureReason(failReason);
            w.setProcessedAt(LocalDateTime.now());
            withdrawalRepository.save(w);
            log.info("Retrait rejeté (batch): withdrawalId={}, reason={}", w.getWithdrawalId(), failReason);
            return toResponse(w, "Retrait rejeté");
        }).collect(Collectors.toList());
        systemSseService.broadcast("withdrawal_updated", "batch_rejected:" + String.join(",", withdrawalIds));
        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public long countPendingWithdrawals() {
        return withdrawalRepository.countByStatus(WithdrawalStatus.PENDING);
    }

    @Override
    @Transactional(readOnly = true)
    public long countWithdrawalsToday() {
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        return withdrawalRepository.countCreatedSince(todayStart);
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
                .userId(w.getUserId())
                .failureReason(w.getFailureReason())
                .processedAt(w.getProcessedAt())
                .createdAt(w.getCreatedAt())
                .message(message)
                .build();
    }
}
