package com.hotspotpay.payment.service.impl;

import com.hotspotpay.payment.model.UserWithdrawal;
import com.hotspotpay.payment.repository.UserWithdrawalRepository;
import com.hotspotpay.payment.service.WithdrawalQuotaService;
import com.hotspotpay.plan.service.PlanFeatureService;
import com.hotspotpay.users.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class WithdrawalQuotaServiceImpl implements WithdrawalQuotaService {

    private final UserWithdrawalRepository userWithdrawalRepository;
    private final PlanFeatureService planFeatureService;

    @Override
    public boolean canWithdraw(User user, BigDecimal amount) {
        String planType = user.getPlanType() != null ? user.getPlanType() : "BASIC";

        BigDecimal dailyLimit   = planFeatureService.getFeatureLimit(planType, "daily_withdrawal_limit");
        BigDecimal monthlyLimit = planFeatureService.getFeatureLimit(planType, "monthly_withdrawal_limit");

        BigDecimal dailyUsed   = getDailyUsed(user);
        BigDecimal monthlyUsed = getMonthlyUsed(user);

        boolean dailyOk   = dailyUsed.add(amount).compareTo(dailyLimit) <= 0;
        boolean monthlyOk = monthlyUsed.add(amount).compareTo(monthlyLimit) <= 0;

        if (!dailyOk) {
            log.warn("Daily withdrawal limit exceeded for user {} (used={}, limit={}, requested={})",
                    user.getUserId(), dailyUsed, dailyLimit, amount);
        }
        if (!monthlyOk) {
            log.warn("Monthly withdrawal limit exceeded for user {} (used={}, limit={}, requested={})",
                    user.getUserId(), monthlyUsed, monthlyLimit, amount);
        }

        return dailyOk && monthlyOk;
    }

    @Override
    @Transactional
    public void recordWithdrawal(User user, BigDecimal amount) {
        UserWithdrawal withdrawal = UserWithdrawal.builder()
                .user(user)
                .amount(amount)
                .withdrawnAt(LocalDateTime.now())
                .description("Retrait enregistré")
                .build();
        userWithdrawalRepository.save(withdrawal);
        log.info("Withdrawal of {} XAF recorded for user {}", amount, user.getUserId());
    }

    @Override
    public BigDecimal getRemainingDailyQuota(User user) {
        String planType = user.getPlanType() != null ? user.getPlanType() : "BASIC";
        BigDecimal limit = planFeatureService.getFeatureLimit(planType, "daily_withdrawal_limit");
        return limit.subtract(getDailyUsed(user)).max(BigDecimal.ZERO);
    }

    @Override
    public BigDecimal getRemainingMonthlyQuota(User user) {
        String planType = user.getPlanType() != null ? user.getPlanType() : "BASIC";
        BigDecimal limit = planFeatureService.getFeatureLimit(planType, "monthly_withdrawal_limit");
        return limit.subtract(getMonthlyUsed(user)).max(BigDecimal.ZERO);
    }

    private BigDecimal getDailyUsed(User user) {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime now        = LocalDateTime.now();
        return userWithdrawalRepository.sumAmountByUserAndDate(user.getUserId(), startOfDay, now);
    }

    private BigDecimal getMonthlyUsed(User user) {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).toLocalDate().atStartOfDay();
        LocalDateTime now          = LocalDateTime.now();
        return userWithdrawalRepository.sumAmountByUserAndDate(user.getUserId(), startOfMonth, now);
    }
}