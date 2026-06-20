package com.hotspotpay.users.repository;

import com.hotspotpay.users.model.User;
import com.hotspotpay.users.role.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);
    Optional<User> findByUserId(String userId);

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    // Recherche multi-champs avec pagination
    @Query("""
        SELECT u FROM User u
        WHERE u.isActive = true
        AND (
            LOWER(u.email)    LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
        )
    """)
    Page<User> searchActive(@Param("search") String search, Pageable pageable);

    // Liste tous les users actifs avec pagination
    Page<User> findAllByIsActiveTrue(Pageable pageable);

    // Filtre par statut actif/inactif
    Page<User> findAllByIsActive(Boolean isActive, Pageable pageable);

    // Par rôle + statut (rôle obligatoire)
    @Query("""
        SELECT u FROM User u
        WHERE u.role = :role
        AND (:isActive IS NULL OR u.isActive = :isActive)
    """)
    Page<User> findAllByRoleAndIsActive(
            @Param("role") UserRole role,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );

    // Par plan + statut (plan obligatoire)
    @Query("""
        SELECT u FROM User u
        WHERE u.planType = :planType
        AND (:isActive IS NULL OR u.isActive = :isActive)
    """)
    Page<User> findAllByPlanTypeAndIsActive(
            @Param("planType") String planType,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );

    // Par rôle + plan + statut
    @Query("""
        SELECT u FROM User u
        WHERE u.role = :role
        AND u.planType = :planType
        AND (:isActive IS NULL OR u.isActive = :isActive)
    """)
    Page<User> findAllByRoleAndPlanTypeAndIsActive(
            @Param("role") UserRole role,
            @Param("planType") String planType,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );
}