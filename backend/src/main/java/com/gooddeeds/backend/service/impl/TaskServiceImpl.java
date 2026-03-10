package com.gooddeeds.backend.service.impl;

import com.gooddeeds.backend.dto.CreateTaskRequest;
import com.gooddeeds.backend.dto.TaskStatisticsDTO;
import com.gooddeeds.backend.dto.UpdateTaskRequest;
import com.gooddeeds.backend.exception.ResourceNotFoundException;
import com.gooddeeds.backend.model.Cause;
import com.gooddeeds.backend.model.Goal;
import com.gooddeeds.backend.model.Task;
import com.gooddeeds.backend.model.TaskStatus;
import com.gooddeeds.backend.repository.CauseRepository;
import com.gooddeeds.backend.repository.GoalRepository;
import com.gooddeeds.backend.repository.TaskRepository;
import com.gooddeeds.backend.service.AuthorizationService;
import com.gooddeeds.backend.service.TaskService;
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
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final CauseRepository causeRepository;
    private final GoalRepository goalRepository;
    private final AuthorizationService authorizationService;

    // ===================== ADMIN OPERATIONS =====================

    @Override
    public Task createTask(UUID adminUserId, CreateTaskRequest request) {
        Cause cause = causeRepository.findById(request.causeId())
                .orElseThrow(() -> new ResourceNotFoundException("Cause not found"));

        authorizationService.requireAdmin(adminUserId, request.causeId());

        Goal goal = null;
        if (request.goalId() != null) {
            goal = goalRepository.findById(request.goalId())
                    .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
            if (!goal.getCause().getId().equals(request.causeId())) {
                throw new IllegalArgumentException("Goal does not belong to the specified cause");
            }
        }

        Task task = Task.builder()
                .title(request.title())
                .description(request.description())
                .status(request.status() != null ? request.status() : TaskStatus.COMING_UP)
                .cause(cause)
                .goal(goal)
                .dueDate(request.dueDate())
                .build();

        log.info("Task '{}' created for cause {} by admin {}", request.title(), request.causeId(), adminUserId);
        return taskRepository.save(task);
    }

    @Override
    public Task getTaskById(UUID userId, UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        authorizationService.requireApprovedMember(userId, task.getCause().getId());
        return task;
    }

    @Override
    public Page<Task> getTasksByCauseId(UUID userId, UUID causeId, int page, int size) {
        authorizationService.requireApprovedMember(userId, causeId);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return taskRepository.findByCauseId(causeId, pageable);
    }

    @Override
    public Page<Task> getTasksByCauseIdAndStatus(UUID userId, UUID causeId, TaskStatus status, int page, int size) {
        authorizationService.requireApprovedMember(userId, causeId);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return taskRepository.findByCauseIdAndStatus(causeId, status, pageable);
    }

    @Override
    public Page<Task> getTasksByGoalId(UUID userId, UUID goalId, int page, int size) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
        authorizationService.requireApprovedMember(userId, goal.getCause().getId());
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return taskRepository.findByGoalId(goalId, pageable);
    }

    @Override
    public Task updateTask(UUID adminUserId, UUID taskId, UpdateTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        authorizationService.requireAdmin(adminUserId, task.getCause().getId());

        if (request.title() != null) {
            task.setTitle(request.title());
        }
        if (request.description() != null) {
            task.setDescription(request.description());
        }
        if (request.status() != null) {
            task.setStatus(request.status());
        }
        if (Boolean.TRUE.equals(request.clearGoal())) {
            task.setGoal(null);
        } else if (request.goalId() != null) {
            Goal goal = goalRepository.findById(request.goalId())
                    .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
            if (!goal.getCause().getId().equals(task.getCause().getId())) {
                throw new IllegalArgumentException("Goal does not belong to the task's cause");
            }
            task.setGoal(goal);
        }
        if (request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }

        log.info("Task {} updated by admin {}", taskId, adminUserId);
        return taskRepository.save(task);
    }

    @Override
    public Task updateTaskStatus(UUID adminUserId, UUID taskId, TaskStatus status) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        authorizationService.requireAdmin(adminUserId, task.getCause().getId());

        task.setStatus(status);
        log.info("Task {} status changed to {} by admin {}", taskId, status, adminUserId);
        return taskRepository.save(task);
    }

    @Override
    public void deleteTask(UUID adminUserId, UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        authorizationService.requireAdmin(adminUserId, task.getCause().getId());

        taskRepository.delete(task);
        log.info("Task {} deleted by admin {}", taskId, adminUserId);
    }

    // ===================== MY TASKS =====================

    @Override
    public Page<Task> getMyTasks(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return taskRepository.findTasksByUserId(userId, pageable);
    }

    @Override
    public Page<Task> getMyTasksByStatus(UUID userId, TaskStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return taskRepository.findTasksByUserIdAndStatus(userId, status, pageable);
    }

    @Override
    public Page<Task> getMyTasksByCauseId(UUID userId, UUID causeId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return taskRepository.findTasksByUserIdAndCauseId(userId, causeId, pageable);
    }

    @Override
    public Page<Task> getMyTasksByCauseIdAndStatus(UUID userId, UUID causeId, TaskStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return taskRepository.findTasksByUserIdAndCauseIdAndStatus(userId, causeId, status, pageable);
    }

    @Override
    public Page<Task> getMyTasksByGoalId(UUID userId, UUID goalId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return taskRepository.findTasksByUserIdAndGoalId(userId, goalId, pageable);
    }

    // ===================== STATISTICS (H4: single query) =====================

    @Override
    public TaskStatisticsDTO getMyTaskStatistics(UUID userId) {
        return taskRepository.getTaskStatisticsByUserId(userId);
    }

    @Override
    public TaskStatisticsDTO getMyTaskStatisticsByCauseId(UUID userId, UUID causeId) {
        Cause cause = causeRepository.findById(causeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cause not found"));
        TaskStatisticsDTO stats = taskRepository.getTaskStatisticsByUserIdAndCauseId(userId, causeId);
        return new TaskStatisticsDTO(
                stats.totalTasks(), stats.completedTasks(), stats.ongoingTasks(), stats.comingUpTasks(),
                causeId, cause.getName()
        );
    }

    @Override
    public TaskStatisticsDTO getMyTaskStatisticsByGoalId(UUID userId, UUID goalId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
        TaskStatisticsDTO stats = taskRepository.getTaskStatisticsByUserIdAndGoalId(userId, goalId);
        return new TaskStatisticsDTO(
                stats.totalTasks(), stats.completedTasks(), stats.ongoingTasks(), stats.comingUpTasks(),
                goal.getCause().getId(), goal.getCause().getName(),
                goalId, goal.getTitle()
        );
    }
}
