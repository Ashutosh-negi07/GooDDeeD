package com.gooddeeds.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateGoalRequest(
        @NotNull(message = "Cause ID is required")
        UUID causeId,

        @NotBlank(message = "Title is required")
        @Size(min = 2, max = 200, message = "Title must be between 2 and 200 characters")
        String title,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description
) {}
