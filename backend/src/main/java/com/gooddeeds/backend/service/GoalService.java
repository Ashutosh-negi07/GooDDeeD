package com.gooddeeds.backend.service;

import com.gooddeeds.backend.dto.CreateGoalRequest;
import com.gooddeeds.backend.dto.UpdateGoalRequest;
import com.gooddeeds.backend.model.Goal;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface GoalService {

    Goal createGoal(UUID adminUserId, CreateGoalRequest request);

    Goal getGoalById(UUID goalId);

    Page<Goal> getGoalsOfCause(UUID causeId, int page, int size);

    Goal updateGoal(UUID adminUserId, UUID goalId, UpdateGoalRequest request);

    void deleteGoal(UUID adminUserId, UUID goalId);
}
