package com.gooddeeds.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record CauseResponseDTO(
        UUID id,
        String name,
        String description,
        boolean restricted,
        Instant createdAt
) {}
