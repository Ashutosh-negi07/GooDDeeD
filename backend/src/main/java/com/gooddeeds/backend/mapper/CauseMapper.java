package com.gooddeeds.backend.mapper;

import com.gooddeeds.backend.dto.CauseResponseDTO;
import com.gooddeeds.backend.model.Cause;

public class CauseMapper {

    public static CauseResponseDTO toDTO(Cause cause) {
        return new CauseResponseDTO(
                cause.getId(),
                cause.getName(),
                cause.getDescription(),
                cause.isRestricted(),
                cause.getCreatedAt()
        );
    }
}
