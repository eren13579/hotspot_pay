package com.hotspotpay.withdrawal.service;

import com.hotspotpay.withdrawal.dto.WithdrawalRequest;
import com.hotspotpay.withdrawal.dto.WithdrawalResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface WithdrawalService {
    WithdrawalResponse request(String userId, WithdrawalRequest req);
    Page<WithdrawalResponse> findAll(String userId, Pageable pageable);
    WithdrawalResponse findById(String userId, String withdrawalId);
    void cancel(String userId, String withdrawalId);

    // ── Admin ──
    Page<WithdrawalResponse> findAllAdmin(Pageable pageable);
    WithdrawalResponse approve(String withdrawalId);
    WithdrawalResponse reject(String withdrawalId, String reason);

    /** Batch approve/reject */
    List<WithdrawalResponse> batchApprove(List<String> withdrawalIds);
    List<WithdrawalResponse> batchReject(List<String> withdrawalIds, String reason);

    /** Notification counts */
    long countPendingWithdrawals();
    long countWithdrawalsToday();
}
