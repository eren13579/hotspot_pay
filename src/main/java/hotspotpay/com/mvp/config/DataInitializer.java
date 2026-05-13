package hotspotpay.com.mvp.config;

import hotspotpay.com.mvp.users.model.User;
import hotspotpay.com.mvp.users.repository.UserRepository;
import hotspotpay.com.mvp.users.role.UserRole;
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
        String adminEmail = "admin@hotspotpay.com";

        // Vérifie si l'admin existe déjà — ne crée pas si c'est le cas
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Admin user already exists, skipping initialization");
            return;
        }

        User admin = User.builder()
                .userId(UUID.randomUUID().toString())
                .email(adminEmail)
                .phone("+237600000000")
                .fullName("Super Admin")
                .password(passwordEncoder.encode("Admin@2024!"))
                .role(UserRole.ADMIN)
                .isActive(true)
                .build();

        userRepository.save(admin);
        log.info("✅ Admin user created: email={}", adminEmail);
    }
}