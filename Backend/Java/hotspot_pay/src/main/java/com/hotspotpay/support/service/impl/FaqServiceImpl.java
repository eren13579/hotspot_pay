package com.hotspotpay.support.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.realtime.service.SystemSseService;
import com.hotspotpay.support.dto.FaqRequest;
import com.hotspotpay.support.dto.FaqResponse;
import com.hotspotpay.support.entity.Faq;
import com.hotspotpay.support.repository.FaqRepository;
import com.hotspotpay.support.service.FaqService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FaqServiceImpl implements FaqService {

    private final FaqRepository repository;
    private final SystemSseService systemSseService;

    @Override
    @Transactional(readOnly = true)
    public List<FaqResponse> getPublicFaqs() {
        return repository.findByIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FaqResponse> findAll() {
        return repository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public FaqResponse create(FaqRequest request) {
        Faq faq = Faq.builder()
                .question(request.getQuestion())
                .answer(request.getAnswer())
                .category(request.getCategory())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        Faq saved = repository.save(faq);
        log.info("FAQ créée: id={}", saved.getId());
        systemSseService.broadcast("faq_updated", "created:" + saved.getId());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public FaqResponse update(String id, FaqRequest request) {
        Faq faq = repository.findById(UUID.fromString(id))
                .orElseThrow(() -> AppException.notFound("FAQ introuvable : " + id));

        faq.setQuestion(request.getQuestion());
        faq.setAnswer(request.getAnswer());
        if (request.getCategory() != null) faq.setCategory(request.getCategory());
        if (request.getSortOrder() != null) faq.setSortOrder(request.getSortOrder());
        if (request.getIsActive() != null) faq.setIsActive(request.getIsActive());

        Faq saved = repository.save(faq);
        log.info("FAQ modifiée: id={}", id);
        systemSseService.broadcast("faq_updated", "updated:" + id);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(String id) {
        Faq faq = repository.findById(UUID.fromString(id))
                .orElseThrow(() -> AppException.notFound("FAQ introuvable : " + id));
        repository.delete(faq);
        log.info("FAQ supprimée: id={}", id);
        systemSseService.broadcast("faq_updated", "deleted:" + id);
    }

    private FaqResponse toResponse(Faq f) {
        return FaqResponse.builder()
                .id(f.getId().toString())
                .question(f.getQuestion())
                .answer(f.getAnswer())
                .category(f.getCategory())
                .sortOrder(f.getSortOrder())
                .isActive(f.getIsActive())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
