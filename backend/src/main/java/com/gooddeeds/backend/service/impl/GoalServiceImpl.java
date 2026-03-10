package com.gooddeeds.backend.service.impl;

import com.gooddeeds.backend.dto.CreateGoalRequest;
import com.gooddeeds.backend.dto.UpdateGoalRequest;
import com.gooddeeds.backend.exception.ResourceNotFoundException;
import com.gooddeeds.backend.model.Cause;
import com.gooddeeds.backend.model.Goal;
import com.gooddeeds.backend.repository.CauseRepository;
import com.gooddeeds.backend.repository.GoalRepository;
import com.gooddeeds.backend.service.AuthorizationService;
import com.gooddeeds.backend.service.GoalService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class GoalServiceImpl implements GoalService {

    private final GoalRepository goalRepository;
    private final CauseRepository causeRepository;
    private final AuthorizationService authorizationService;

    @Override
    public Goal createGoal(UUID adminUserId, CreateGoalRequest request) {
        Cause cause = causeRepository.findById(request.causeId())
                .orElseThrow(() -> new ResourceNotFoundException("Cause not found"));

        authorizationService.requireAdmin(adminUserId, request.causeId());

        Goal goal = Goal.builder()
                .title(request.title())
                .description(request.description())
                .cause(cause)
                .build();

        log.info("Goal '{}' created for cause {} by admin {}", request.title(), request.causeId(), adminUserId);
        return goalRepository.save(goal);
    }

    @Override
    public Goal getGoalById(UUID goalId) {
        return goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
    }

    @Override
    public Page<Goal> getGoalsOfCause(UUID causeId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return goalRepository.findByCauseId(causeId, pageable);
    }

    @Override
    public Goal updateGoal(UUID adminUserId, UUID goalId, UpdateGoalRequest request) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));

        UUID causeId = goal.getCause().getId();
        authorizationService.requireAdmin(adminUserId, causeId);

        if (request.title() != null) {
            goal.setTitle(request.title());
        }
        if (request.description() != null) {
            goal.setDescription(request.description());
        }

        log.info("Goal {} updated by admin {}", goalId, adminUserId);
        return goalRepository.save(goal);
    }

    @Override
    public void deleteGoal(UUID adminUserId, UUID goalId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));

        UUID causeId = goal.getCause().getId();
        authorizationService.requireAdmin(adminUserId, causeId);

        goalRepository.delete(goal);
        log.info("Goal {} deleted by admin {}", goalId, adminUserId);
    }
}
