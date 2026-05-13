package hotspotpay.com.mvp.users.service;

import hotspotpay.com.mvp.users.dto.UserResponse;
import hotspotpay.com.mvp.users.dto.UpdateUserRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

public interface UserService {

    Page<UserResponse> findAll(Pageable pageable);

    Page<UserResponse> search(String query, Pageable pageable);

    UserResponse getMe();

    UserResponse updateMe(UpdateUserRequest request);

    @Transactional
    UserResponse update(String userId, UpdateUserRequest request);

    void delete(String userId);
}
