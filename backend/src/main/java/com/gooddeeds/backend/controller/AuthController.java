package com.gooddeeds.backend.controller;

import com.gooddeeds.backend.dto.CreateUserRequest;
import com.gooddeeds.backend.dto.LoginRequest;
import com.gooddeeds.backend.dto.UserResponseDTO;
import com.gooddeeds.backend.mapper.UserMapper;
import com.gooddeeds.backend.model.User;
import com.gooddeeds.backend.repository.UserRepository;
import com.gooddeeds.backend.security.JwtService;
import com.gooddeeds.backend.security.SecurityUtils;
import com.gooddeeds.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

        private final AuthenticationManager authenticationManager;
        private final JwtService jwtService;
        private final UserRepository userRepository;
        private final UserService userService;

        // Register and return JWT token
        @PostMapping("/register")
        public Map<String, Object> register(@Valid @RequestBody CreateUserRequest request) {
                // Create user
                User user = userService.createUser(request);

                // Generate token
                String token = jwtService.generateToken(user.getEmail(), user.getId());

                return Map.of(
                                "token", token,
                                "user", UserMapper.toDTO(user));
        }

        // Login and return JWT token
        @PostMapping("/login")
        public Map<String, Object> login(@Valid @RequestBody LoginRequest request) {

                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.email(),
                                                request.password()));

                String email = authentication.getName();

                // Fetch user to get the ID for the token
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new IllegalStateException("User not found after authentication"));

                String token = jwtService.generateToken(email, user.getId());

                return Map.of(
                                "token", token,
                                "user", UserMapper.toDTO(user));
        }

        // Get current authenticated user's profile
        @GetMapping("/me")
        public UserResponseDTO getCurrentUser() {
                UUID userId = SecurityUtils.getCurrentUserId();

                return userRepository.findById(userId)
                                .map(UserMapper::toDTO)
                                .orElseThrow(() -> new RuntimeException("User not found"));
        }
}
