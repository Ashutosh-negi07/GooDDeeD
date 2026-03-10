package com.gooddeeds.backend.dto;

import jakarta.validation.constraints.Size;

public record UpdateGoalRequest(
        @Size(min = 2, max = 200, message = "Title must be between 2 and 200 characters")
        String title,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description
) {}
