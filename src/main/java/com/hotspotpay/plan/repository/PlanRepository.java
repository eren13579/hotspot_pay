package com.hotspotpay.plan.repository;

import com.hotspotpay.plan.model.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlanRepository extends JpaRepository<Plan, UUID> {

    Optional<Plan> findByPlanId(String planId);

    Optional<Plan> findByPlanIdAndHotspotId(String planId, String hotspotId);

    // Tous les forfaits d'un hotspot (actifs + inactifs) — pour le dashboard owner
    List<Plan> findAllByHotspotIdOrderByDisplayOrderAscCreatedAtAsc(String hotspotId);

    // Uniquement les forfaits actifs — pour le portail captif public
    List<Plan> findAllByHotspotIdAndIsActiveTrueOrderByDisplayOrderAscPriceAsc(String hotspotId);

    boolean existsByPlanId(String planId);

    boolean existsByNameAndHotspotId(String name, String hotspotId);

    @Modifying
    @Query("UPDATE Plan p SET p.isActive = :active WHERE p.planId = :planId")
    void updateActiveStatus(@Param("planId") String planId, @Param("active") boolean active);
}