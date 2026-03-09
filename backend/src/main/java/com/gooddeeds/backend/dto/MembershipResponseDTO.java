package com.gooddeeds.backend.dto;

import java.util.UUID;
import java.time.Instant;

public record MembershipResponseDTO(
        UUID membershipId,
        UUID userId,
        String userName,
        UUID causeId,
        String causeName,
        String role,
        boolean approved,
        Instant joinedAt
) {}
