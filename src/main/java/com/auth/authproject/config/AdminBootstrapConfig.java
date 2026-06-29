package com.auth.authproject.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.auth.authproject.entity.User;
import com.auth.authproject.repository.UserRepository;

@Configuration
public class AdminBootstrapConfig {

    @Bean
    CommandLineRunner adminBootstrap(UserRepository userRepository,
                                     PasswordEncoder passwordEncoder,
                                     @Value("${app.admin.name:Admin}") String adminName,
                                     @Value("${app.admin.email:}") String adminEmail,
                                     @Value("${app.admin.password:}") String adminPassword) {
        return args -> {
            if (adminEmail.isBlank() || adminPassword.isBlank()) {
                return;
            }

            User admin = userRepository.findByEmail(adminEmail).orElseGet(User::new);
            admin.setName(adminName);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole("ADMIN");
            userRepository.save(admin);
        };
    }
}
