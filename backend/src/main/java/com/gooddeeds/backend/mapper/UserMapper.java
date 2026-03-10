package com.gooddeeds.backend.mapper;

import com.gooddeeds.backend.dto.UserResponseDTO;
import com.gooddeeds.backend.model.User;

public class UserMapper {

    public static UserResponseDTO toDTO(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCreatedAt()
        );
    }
}
