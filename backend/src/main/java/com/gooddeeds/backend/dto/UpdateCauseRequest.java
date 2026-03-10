package com.gooddeeds.backend.dto;

import jakarta.validation.constraints.Size;

public record UpdateCauseRequest(
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        String name,

        @Size(max = 500, message = "Description cannot exceed 500 characters")
        String description,

        Boolean restricted
) {}
