package com.hotspotpay.config;

import com.hotspotpay.users.model.User;
import com.hotspotpay.users.repository.UserRepository;
import com.hotspotpay.users.role.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        initAdminUser();
    }

    private void initAdminUser() {
        String adminEmail = "tedapatrick4@gmail.com";

        // Vérifie si l'admin existe déjà — ne crée pas si c'est le cas
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Admin user already exists, skipping initialization");
            return;
        }

        User admin = User.builder()
                .userId(UUID.randomUUID().toString())
                .email(adminEmail)
                .phone("+237656721535")
                .fullName("Super Admin")
                .password(passwordEncoder.encode("Made@2006"))
                .planType("PREMIUM")
                .role(UserRole.ADMIN)
                .isActive(true)
                .build();

        userRepository.save(admin);
        log.info("✅ Admin user created: email={}", adminEmail);
    }
}