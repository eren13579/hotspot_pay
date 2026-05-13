package hotspotpay.com.mvp.users.service.impl;

import hotspotpay.com.mvp.common.exception.AppException;
import hotspotpay.com.mvp.users.dto.UpdateUserRequest;
import hotspotpay.com.mvp.users.dto.UserResponse;
import hotspotpay.com.mvp.users.model.User;
import hotspotpay.com.mvp.users.repository.UserRepository;
import hotspotpay.com.mvp.users.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> findAll(Pageable pageable) {
        return userRepository.findAllByIsActiveTrue(pageable).map(this::toResponse);
    }

    @Override
    public Page<UserResponse> search(String query, Pageable pageable) {
        return null;
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
        userRepository.save(user);
        log.info("Profile updated for userId={}", user.getUserId());
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