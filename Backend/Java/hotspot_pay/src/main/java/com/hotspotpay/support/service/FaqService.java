package com.hotspotpay.support.service;

import com.hotspotpay.support.dto.FaqRequest;
import com.hotspotpay.support.dto.FaqResponse;

import java.util.List;

public interface FaqService {

    /** FAQ publique (actives uniquement) */
    List<FaqResponse> getPublicFaqs();

    /** Toutes les FAQ (admin) */
    List<FaqResponse> findAll();

    /** Créer une FAQ (admin) */
    FaqResponse create(FaqRequest request);

    /** Modifier une FAQ (admin) */
    FaqResponse update(String id, FaqRequest request);

    /** Supprimer une FAQ (admin) */
    void delete(String id);
}
