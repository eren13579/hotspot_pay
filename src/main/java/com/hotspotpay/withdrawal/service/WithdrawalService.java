package com.hotspotpay.withdrawal.service;

import com.hotspotpay.withdrawal.dto.WithdrawalRequest;
import com.hotspotpay.withdrawal.dto.WithdrawalResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface WithdrawalService {
    WithdrawalResponse request(String userId, WithdrawalRequest req);
    Page<WithdrawalResponse> findAll(String userId, Pageable pageable);
    WithdrawalResponse findById(String userId, String withdrawalId);
    void cancel(String userId, String withdrawalId);
}
