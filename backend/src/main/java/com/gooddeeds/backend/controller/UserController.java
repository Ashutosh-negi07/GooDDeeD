package com.gooddeeds.backend.controller;

import com.gooddeeds.backend.dto.CreateUserRequest;
import com.gooddeeds.backend.dto.UserResponseDTO;
import com.gooddeeds.backend.mapper.UserMapper;
import com.gooddeeds.backend.security.SecurityUtils;
import com.gooddeeds.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Create user
    @PostMapping
    public UserResponseDTO createUser(@Valid @RequestBody CreateUserRequest request) {
        return UserMapper.toDTO(
                userService.createUser(request));
    }

    // Get user by ID
    @GetMapping("/{id}")
    public UserResponseDTO getUserById(@PathVariable UUID id) {
        return userService.getUserById(id)
                .map(UserMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Get user by email
    @GetMapping("/by-email")
    public UserResponseDTO getUserByEmail(@RequestParam String email) {
        return userService.getUserByEmail(email)
                .map(UserMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Update user
    @PutMapping("/{id}")
    public UserResponseDTO updateUser(
            @PathVariable UUID id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email) {
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();
        return UserMapper.toDTO(
                userService.updateUser(authenticatedUserId, id, name, email));
    }

    // Delete user
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable UUID id) {
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();
        userService.deleteUser(authenticatedUserId, id);
    }
}
