package com.gooddeeds.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record GoalResponseDTO(
        UUID id,
        String title,
        String description,
        UUID causeId,
        String causeName,
        Instant createdAt
) {}
