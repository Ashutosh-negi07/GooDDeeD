package com.gooddeeds.backend.service.impl;

import com.gooddeeds.backend.dto.CreateUserRequest;
import com.gooddeeds.backend.exception.EmailAlreadyExistsException;
import com.gooddeeds.backend.exception.ForbiddenException;
import com.gooddeeds.backend.exception.ResourceNotFoundException;
import com.gooddeeds.backend.model.User;
import com.gooddeeds.backend.repository.UserRepository;
import com.gooddeeds.backend.service.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public User createUser(CreateUserRequest request) {
        String normalizedEmail = request.email().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        User user = User.builder()
                .name(request.name().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        log.info("User registered: {}", normalizedEmail);
        return userRepository.save(user);
    }

    @Override
    public Optional<User> getUserById(UUID id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> getUserByEmail(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        return userRepository.findByEmail(normalizedEmail);
    }

    @Override
    public User authenticate(String email, String password) {
        String normalizedEmail = email.toLowerCase().trim();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ForbiddenException("Invalid credentials");
        }

        return user;
    }

    // C3 fix: Only the authenticated user can update their own profile
    @Override
    public User updateUser(UUID authenticatedUserId, UUID targetId, String name, String email) {
        if (!authenticatedUserId.equals(targetId)) {
            throw new ForbiddenException("You can only update your own profile");
        }

        User user = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (name != null) {
            user.setName(name.trim());
        }
        if (email != null) {
            String normalizedEmail = email.toLowerCase().trim();
            if (!normalizedEmail.equals(user.getEmail()) && userRepository.existsByEmail(normalizedEmail)) {
                throw new EmailAlreadyExistsException("Email already exists");
            }
            user.setEmail(normalizedEmail);
        }

        log.info("User {} updated their profile", targetId);
        return userRepository.save(user);
    }

    // C3 fix: Only the authenticated user can delete their own account
    @Override
    public void deleteUser(UUID authenticatedUserId, UUID targetId) {
        if (!authenticatedUserId.equals(targetId)) {
            throw new ForbiddenException("You can only delete your own account");
        }

        User user = userRepository.findById(targetId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        userRepository.delete(user);
        log.info("User {} deleted their account", targetId);
    }
}
