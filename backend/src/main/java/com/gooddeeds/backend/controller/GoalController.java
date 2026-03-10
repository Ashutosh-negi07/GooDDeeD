package com.gooddeeds.backend.controller;

import com.gooddeeds.backend.dto.CreateGoalRequest;
import com.gooddeeds.backend.dto.GoalResponseDTO;
import com.gooddeeds.backend.dto.UpdateGoalRequest;
import com.gooddeeds.backend.mapper.GoalMapper;
import com.gooddeeds.backend.security.SecurityUtils;
import com.gooddeeds.backend.service.GoalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    // Create goal (admin only)
    @PostMapping
    public GoalResponseDTO createGoal(@Valid @RequestBody CreateGoalRequest request) {
        UUID adminUserId = SecurityUtils.getCurrentUserId();
        return GoalMapper.toDTO(
                goalService.createGoal(adminUserId, request));
    }

    // Get goal by ID
    @GetMapping("/{id}")
    public GoalResponseDTO getGoalById(@PathVariable UUID id) {
        return GoalMapper.toDTO(
                goalService.getGoalById(id));
    }

    // Get goals of a cause (paginated)
    @GetMapping("/cause/{causeId}")
    public Page<GoalResponseDTO> getGoals(
            @PathVariable UUID causeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {
        return goalService.getGoalsOfCause(causeId, page, size)
                .map(GoalMapper::toDTO);
    }

    // Update goal (admin only)
    @PutMapping("/{id}")
    public GoalResponseDTO updateGoal(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGoalRequest request) {
        UUID adminUserId = SecurityUtils.getCurrentUserId();
        return GoalMapper.toDTO(
                goalService.updateGoal(adminUserId, id, request));
    }

    // Delete goal (admin only)
    @DeleteMapping("/{id}")
    public void deleteGoal(@PathVariable UUID id) {
        UUID adminUserId = SecurityUtils.getCurrentUserId();
        goalService.deleteGoal(adminUserId, id);
    }
}
