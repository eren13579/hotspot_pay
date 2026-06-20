package com.hotspotpay.router.repository;

import com.hotspotpay.router.model.RouterBrand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RouterBrandRepository extends JpaRepository<RouterBrand, UUID> {

    Optional<RouterBrand> findBySlug(String slug);

    List<RouterBrand> findByIsActiveTrueOrderByNameAsc();

    boolean existsBySlug(String slug);
}
