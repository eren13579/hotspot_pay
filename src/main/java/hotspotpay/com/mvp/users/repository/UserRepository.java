package hotspotpay.com.mvp.users.repository;

import hotspotpay.com.mvp.users.model.User;
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
}