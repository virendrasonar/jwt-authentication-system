package com.auth.authproject.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.auth.authproject.dto.AdminUserRequest;
import com.auth.authproject.dto.AdminUserUpdateRequest;
import com.auth.authproject.dto.UserResponse;
import com.auth.authproject.entity.User;
import com.auth.authproject.repository.UserRepository;
import com.auth.authproject.service.RefreshTokenService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/users")
public class AdminUserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    public AdminUserController(UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
    }

    @GetMapping
    public List<UserResponse> listUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::new)
                .toList();
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return new UserResponse(findUser(id));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody AdminUserRequest request) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new RuntimeException("Password is required");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(normalizeRole(request.getRole()));

        return ResponseEntity.status(HttpStatus.CREATED).body(new UserResponse(userRepository.save(user)));
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(@PathVariable Long id,
                                   @Valid @RequestBody AdminUserUpdateRequest request,
                                   Authentication authentication) {
        User user = findUser(id);
        String requestedRole = normalizeRole(request.getRole());

        if (user.getEmail().equals(authentication.getName()) && !user.getRole().equals(requestedRole)) {
            throw new RuntimeException("Admin cannot change their own role");
        }

        if (user.getRole().equals("ADMIN") && requestedRole.equals("USER") && isLastAdmin(user)) {
            throw new RuntimeException("At least one admin account is required");
        }

        user.setName(request.getName());
        user.setRole(requestedRole);

        return new UserResponse(userRepository.save(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication authentication) {
        User user = findUser(id);

        if (user.getEmail().equals(authentication.getName())) {
            throw new RuntimeException("Admin cannot delete their own account while logged in");
        }

        if (user.getRole().equals("ADMIN") && isLastAdmin(user)) {
            throw new RuntimeException("At least one admin account is required");
        }

        refreshTokenService.deleteByUserId(user.getId());
        userRepository.delete(user);

        return ResponseEntity.noContent().build();
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean isLastAdmin(User user) {
        return user.getRole().equals("ADMIN") && userRepository.countByRole("ADMIN") <= 1;
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "USER";
        }

        String normalized = role.trim().toUpperCase();

        if (!normalized.equals("USER") && !normalized.equals("ADMIN")) {
            throw new RuntimeException("Role must be USER or ADMIN");
        }

        return normalized;
    }
}
