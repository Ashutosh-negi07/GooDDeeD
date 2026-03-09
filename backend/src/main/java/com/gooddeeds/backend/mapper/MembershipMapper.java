package com.gooddeeds.backend.mapper;

import com.gooddeeds.backend.dto.MembershipResponseDTO;
import com.gooddeeds.backend.model.CauseMembership;

public class MembershipMapper {

    public static MembershipResponseDTO toDTO(CauseMembership membership) {
        return new MembershipResponseDTO(
                membership.getId(),
                membership.getUser().getId(),
                membership.getUser().getName(),
                membership.getCause().getId(),
                membership.getCause().getName(),
                membership.getRole().name(),
                membership.isApproved(),
                membership.getJoinedAt()
        );
    }
}
