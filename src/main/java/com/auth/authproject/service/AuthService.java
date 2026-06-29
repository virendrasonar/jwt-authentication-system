package com.auth.authproject.service;

import com.auth.authproject.dto.AuthRequest;
import com.auth.authproject.dto.AuthResponse;
import com.auth.authproject.dto.RegisterRequest;
import com.auth.authproject.entity.RefreshToken;
import com.auth.authproject.entity.User;
import com.auth.authproject.repository.UserRepository;
import com.auth.authproject.security.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    public AuthResponse register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");

        User savedUser = userRepository.save(user);

        String accessToken = jwtService.generateToken(savedUser.getEmail(), savedUser.getRole());

        refreshTokenService.deleteByUserId(savedUser.getId());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser);

        return buildAuthResponse(accessToken, refreshToken.getToken(), savedUser);
    }

    public AuthResponse login(AuthRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String accessToken = jwtService.generateToken(user.getEmail(), user.getRole());

        refreshTokenService.deleteByUserId(user.getId());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return buildAuthResponse(accessToken, refreshToken.getToken(), user);
    }

    public AuthResponse refreshToken(String requestToken) {

        RefreshToken refreshToken = refreshTokenService.findByToken(requestToken)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        refreshTokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();
        String accessToken = jwtService.generateToken(user.getEmail(), user.getRole());

        return buildAuthResponse(accessToken, requestToken, user);
    }

    public String logout(String requestToken) {

        RefreshToken token = refreshTokenService.findByToken(requestToken)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        refreshTokenService.deleteByUserId(token.getUser().getId());

        return "Logged out successfully";
    }

    private AuthResponse buildAuthResponse(String accessToken, String refreshToken, User user) {
        return new AuthResponse(
                accessToken,
                refreshToken,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
