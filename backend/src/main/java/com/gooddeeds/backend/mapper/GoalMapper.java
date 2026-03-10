package com.gooddeeds.backend.mapper;

import com.gooddeeds.backend.dto.GoalResponseDTO;
import com.gooddeeds.backend.model.Goal;

public class GoalMapper {

    public static GoalResponseDTO toDTO(Goal goal) {
        return new GoalResponseDTO(
                goal.getId(),
                goal.getTitle(),
                goal.getDescription(),
                goal.getCause().getId(),
                goal.getCause().getName(),
                goal.getCreatedAt()
        );
    }
}
