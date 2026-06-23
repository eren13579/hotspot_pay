package com.hotspotpay.support.repository;

import com.hotspotpay.support.entity.Faq;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FaqRepository extends JpaRepository<Faq, UUID> {

    /** FAQ actives triées (publique) */
    List<Faq> findByIsActiveTrueOrderBySortOrderAsc();

    /** Toutes les FAQ triées par ordre (admin) */
    List<Faq> findAllByOrderBySortOrderAsc();

    /** FAQ par catégorie */
    List<Faq> findByCategoryOrderBySortOrderAsc(String category);
}
