package com.hotspotpay.payment.service;

import com.hotspotpay.users.model.User;
import java.math.BigDecimal;

public interface WithdrawalQuotaService {
    boolean canWithdraw(User user, BigDecimal amount);
    void recordWithdrawal(User user, BigDecimal amount);
    BigDecimal getRemainingDailyQuota(User user);
    BigDecimal getRemainingMonthlyQuota(User user);
}