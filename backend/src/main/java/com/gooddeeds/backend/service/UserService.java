
package com.gooddeeds.backend.service;

import com.gooddeeds.backend.dto.CreateUserRequest;
import com.gooddeeds.backend.model.User;

import java.util.Optional;
import java.util.UUID;

public interface UserService {

    User createUser(CreateUserRequest request);

    Optional<User> getUserById(UUID id);

    Optional<User> getUserByEmail(String email);

    User authenticate(String email, String password);

    User updateUser(UUID authenticatedUserId, UUID targetId, String name, String email);

    void deleteUser(UUID authenticatedUserId, UUID targetId);
}
