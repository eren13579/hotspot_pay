package com.hotspotpay.users.service.impl;

import com.hotspotpay.common.exception.AppException;
import com.hotspotpay.users.dto.CreateUserRequest;
import com.hotspotpay.users.dto.UpdateUserRequest;
import com.hotspotpay.users.dto.UserResponse;
import com.hotspotpay.users.model.User;
import com.hotspotpay.users.repository.UserRepository;
import com.hotspotpay.users.role.UserRole;
import com.hotspotpay.users.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> findAll(Pageable pageable) {
        return userRepository.findAllByIsActiveTrue(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> findAll(Boolean active, String role, String planType, Pageable pageable) {
        UserRole userRole = null;
        if (role != null) {
            try { userRole = UserRole.valueOf(role); }
            catch (IllegalArgumentException ignored) {}
        }
        if (userRole != null && planType != null) {
            return userRepository.findAllByRoleAndPlanTypeAndIsActive(userRole, planType, active, pageable)
                    .map(this::toResponse);
        }
        if (userRole != null) {
            return userRepository.findAllByRoleAndIsActive(userRole, active, pageable).map(this::toResponse);
        }
        if (planType != null) {
            return userRepository.findAllByPlanTypeAndIsActive(planType, active, pageable).map(this::toResponse);
        }
        // Aucun filtre — tous les users ou par statut actif/inactif
        if (active == null) {
            return userRepository.findAll(pageable).map(this::toResponse);
        }
        return userRepository.findAllByIsActive(active, pageable).map(this::toResponse);
    }

    @Override
    public Page<UserResponse> search(String query, Pageable pageable) {
        return userRepository.searchActive(query, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getMe() {
        return toResponse(currentUser());
    }

    @Override
    @Transactional
    public UserResponse updateMe(UpdateUserRequest request) {
        User user = currentUser();
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone()    != null) user.setPhone(request.getPhone());
        if (request.getCountry()  != null) user.setCountry(request.getCountry());
        if (request.getPlanType() != null) user.setPlanType(request.getPlanType());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        userRepository.save(user);
        log.info("Profile updated for userId={}", user.getUserId());
        return toResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getById(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));
        return toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw AppException.conflict("Cet email est déjà utilisé");
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()
                && userRepository.existsByPhone(request.getPhone())) {
            throw AppException.conflict("Ce numéro de téléphone est déjà utilisé");
        }

        UserRole role = UserRole.USER;
        if (request.getRole() != null) {
            try { role = UserRole.valueOf(request.getRole()); }
            catch (IllegalArgumentException ignored) {}
        }

        User user = User.builder()
                .userId(UUID.randomUUID().toString())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .country(request.getCountry())
                .phone(request.getPhone())
                .planType(request.getPlanType() != null ? request.getPlanType() : "STANDARD")
                .role(role)
                .isActive(true)
                .build();

        userRepository.save(user);
        log.info("Admin created user: userId={}, email={}, role={}",
                user.getUserId(), user.getEmail(), user.getRole());
        return toResponse(user);
    }

    @Transactional
    @Override
    public UserResponse update(String userId, UpdateUserRequest request) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone()    != null) user.setPhone(request.getPhone());
        if (request.getCountry()  != null) user.setCountry(request.getCountry());
        if (request.getPlanType() != null) user.setPlanType(request.getPlanType());
        if (request.getIsActive() != null) user.setIsActive(request.getIsActive());
        userRepository.save(user);
        return toResponse(user);
    }

    @Override
    @Transactional
    public void delete(String userId) {
        User user = userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));
        user.setIsActive(false);
        userRepository.save(user);
        log.info("User soft-deleted: userId={}", userId);
    }

    // ── Privé ──────────────────────────────────────────────────────────────

    private User currentUser() {
        String userId = (String) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userRepository.findByUserId(userId)
                .orElseThrow(() -> AppException.notFound("Utilisateur introuvable"));
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .userId(u.getUserId())
                .email(u.getEmail())
                .phone(u.getPhone())
                .fullName(u.getFullName())
                .country(u.getCountry())
                .planType(u.getPlanType())
                .role(u.getRole().name())
                .isActive(u.getIsActive())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}