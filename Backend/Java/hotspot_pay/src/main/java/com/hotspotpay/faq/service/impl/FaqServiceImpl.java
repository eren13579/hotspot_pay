package com.hotspotpay.faq.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.faq.dto.FaqRequest;
import com.hotspotpay.faq.dto.FaqResponse;
import com.hotspotpay.faq.model.Faq;
import com.hotspotpay.faq.repository.FaqRepository;
import com.hotspotpay.faq.service.FaqService;
import com.hotspotpay.realtime.service.SseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FaqServiceImpl implements FaqService {

    private final FaqRepository faqRepository;
    private final SseService sseService;

    @Override
    @Transactional(readOnly = true)
    public Map<String, List<FaqResponse>> getPublicFaqs() {
        return faqRepository.findByIsActiveTrueOrderByCategoryAscSortOrderAsc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.groupingBy(
                        FaqResponse::getCategory,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FaqResponse> getAllFaqs() {
        return faqRepository.findAllByOrderByCategoryAscSortOrderAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public FaqResponse createFaq(FaqRequest request) {
        Faq faq = Faq.builder()
                .question(request.getQuestion())
                .answer(request.getAnswer())
                .category(request.getCategory())
                .sortOrder(request.getSortOrder())
                .isActive(request.isActive())
                .build();

        faqRepository.save(faq);
        log.info("FAQ créée: id={}, category={}", faq.getId(), faq.getCategory());

        broadcastFaqUpdated();
        return toResponse(faq);
    }

    @Override
    @Transactional
    public FaqResponse updateFaq(UUID id, FaqRequest request) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("FAQ introuvable: " + id));

        faq.setQuestion(request.getQuestion());
        faq.setAnswer(request.getAnswer());
        faq.setCategory(request.getCategory());
        faq.setSortOrder(request.getSortOrder());
        faq.setActive(request.isActive());

        faqRepository.save(faq);
        log.info("FAQ modifiée: id={}", faq.getId());

        broadcastFaqUpdated();
        return toResponse(faq);
    }

    @Override
    @Transactional
    public void deleteFaq(UUID id) {
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("FAQ introuvable: " + id));
        faqRepository.delete(faq);
        log.info("FAQ supprimée: id={}", id);

        broadcastFaqUpdated();
    }

    private void broadcastFaqUpdated() {
        try {
            sseService.broadcast("faq_updated", Map.of("type", "faq_updated"));
        } catch (Exception e) {
            log.warn("SSE broadcast FAQ error: {}", e.getMessage());
        }
    }

    private FaqResponse toResponse(Faq faq) {
        return FaqResponse.builder()
                .id(faq.getId())
                .question(faq.getQuestion())
                .answer(faq.getAnswer())
                .category(faq.getCategory())
                .sortOrder(faq.getSortOrder())
                .isActive(faq.isActive())
                .build();
    }
}
