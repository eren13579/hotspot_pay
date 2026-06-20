package com.hotspotpay.router.repository;

import com.hotspotpay.router.model.RouterModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RouterModelRepository extends JpaRepository<RouterModel, UUID> {

    List<RouterModel> findByBrandIdAndIsActiveTrueOrderByNameAsc(UUID brandId);

    Optional<RouterModel> findByBrandIdAndSlug(UUID brandId, String slug);

    boolean existsByBrandIdAndSlug(UUID brandId, String slug);

    long countByBrandId(UUID brandId);
}
