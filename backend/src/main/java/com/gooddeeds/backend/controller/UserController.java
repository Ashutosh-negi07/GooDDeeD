package com.gooddeeds.backend.controller;

import com.gooddeeds.backend.dto.CreateUserRequest;
import com.gooddeeds.backend.dto.UserResponseDTO;
import com.gooddeeds.backend.exception.ResourceNotFoundException;
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
    public UserResponseDTO getUserById(@PathVariable("id") UUID id) {
        return userService.getUserById(id)
                .map(UserMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // Get user by email
    @GetMapping("/by-email")
    public UserResponseDTO getUserByEmail(@RequestParam("email") String email) {
        return userService.getUserByEmail(email)
                .map(UserMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // Update user
    @PutMapping("/{id}")
    public UserResponseDTO updateUser(
            @PathVariable("id") UUID id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "email", required = false) String email) {
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();
        return UserMapper.toDTO(
                userService.updateUser(authenticatedUserId, id, name, email));
    }

    // Delete user
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable("id") UUID id) {
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();
        userService.deleteUser(authenticatedUserId, id);
    }
}
