package com.hotspotpay.faq.service;

import com.hotspotpay.faq.dto.FaqRequest;
import com.hotspotpay.faq.dto.FaqResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface FaqService {

    Map<String, List<FaqResponse>> getPublicFaqs();

    List<FaqResponse> getAllFaqs();

    FaqResponse createFaq(FaqRequest request);

    FaqResponse updateFaq(UUID id, FaqRequest request);

    void deleteFaq(UUID id);
}
