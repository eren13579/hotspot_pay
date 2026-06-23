package com.hotspotpay.users.service;

import com.hotspotpay.users.dto.CreateUserRequest;
import com.hotspotpay.users.dto.UserResponse;
import com.hotspotpay.users.dto.UpdateUserRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {

    Page<UserResponse> findAll(Pageable pageable);

    Page<UserResponse> findAll(Boolean active, String role, String planType, Pageable pageable);

    Page<UserResponse> search(String query, Pageable pageable);

    UserResponse getMe();

    UserResponse updateMe(UpdateUserRequest request);

    UserResponse create(CreateUserRequest request);

    UserResponse getById(String userId);

    UserResponse update(String userId, UpdateUserRequest request);

    void delete(String userId);
}
