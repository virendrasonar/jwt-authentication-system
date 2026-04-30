package com.auth.authproject.controller;

import com.auth.authproject.dto.UserRequestDTO;
import com.auth.authproject.dto.UserResponseDTO;
import com.auth.authproject.dto.LoginRequestDTO;
import com.auth.authproject.dto.LoginResponseDTO;
import com.auth.authproject.service.UserService;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public UserResponseDTO register(@RequestBody UserRequestDTO requestDTO) {
        return userService.register(requestDTO);
    }

    @PostMapping("/login")
    public LoginResponseDTO login(@RequestBody LoginRequestDTO requestDTO) {
        return userService.login(requestDTO);
    }
}