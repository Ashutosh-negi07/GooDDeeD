package com.gooddeeds.backend.repository;

import com.gooddeeds.backend.dto.TaskStatisticsDTO;
import com.gooddeeds.backend.model.Task;
import com.gooddeeds.backend.model.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    // Find tasks by cause
    Page<Task> findByCauseId(UUID causeId, Pageable pageable);

    // Find tasks by cause and status
    Page<Task> findByCauseIdAndStatus(UUID causeId, TaskStatus status, Pageable pageable);

    // Find tasks by goal
    Page<Task> findByGoalId(UUID goalId, Pageable pageable);

    // Find tasks by cause and goal
    Page<Task> findByCauseIdAndGoalId(UUID causeId, UUID goalId, Pageable pageable);

    // Count tasks by cause and status
    long countByCauseIdAndStatus(UUID causeId, TaskStatus status);

    // Count all tasks by cause
    long countByCauseId(UUID causeId);

    // Find all tasks for causes the user is a member of (for "my tasks")
    @Query("""
                SELECT t FROM Task t
                WHERE t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
            """)
    Page<Task> findTasksByUserId(@Param("userId") UUID userId, Pageable pageable);

    // Find tasks by user and status
    @Query("""
                SELECT t FROM Task t
                WHERE t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
                AND t.status = :status
            """)
    Page<Task> findTasksByUserIdAndStatus(
            @Param("userId") UUID userId,
            @Param("status") TaskStatus status,
            Pageable pageable);

    // Find tasks by user and cause
    @Query("""
                SELECT t FROM Task t
                WHERE t.cause.id = :causeId
                AND t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
            """)
    Page<Task> findTasksByUserIdAndCauseId(
            @Param("userId") UUID userId,
            @Param("causeId") UUID causeId,
            Pageable pageable);

    // Find tasks by user, cause and status
    @Query("""
                SELECT t FROM Task t
                WHERE t.cause.id = :causeId
                AND t.status = :status
                AND t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
            """)
    Page<Task> findTasksByUserIdAndCauseIdAndStatus(
            @Param("userId") UUID userId,
            @Param("causeId") UUID causeId,
            @Param("status") TaskStatus status,
            Pageable pageable);

    // Find tasks by user and goal
    @Query("""
                SELECT t FROM Task t
                WHERE t.goal.id = :goalId
                AND t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
            """)
    Page<Task> findTasksByUserIdAndGoalId(
            @Param("userId") UUID userId,
            @Param("goalId") UUID goalId,
            Pageable pageable);

    // Count tasks for user by status
    @Query("""
                SELECT COUNT(t) FROM Task t
                WHERE t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
                AND t.status = :status
            """)
    long countTasksByUserIdAndStatus(
            @Param("userId") UUID userId,
            @Param("status") TaskStatus status);

    // Count all tasks for user
    @Query("""
                SELECT COUNT(t) FROM Task t
                WHERE t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
            """)
    long countTasksByUserId(@Param("userId") UUID userId);

    // Count tasks for user by cause and status
    @Query("""
                SELECT COUNT(t) FROM Task t
                WHERE t.cause.id = :causeId
                AND t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
                AND t.status = :status
            """)
    long countTasksByUserIdAndCauseIdAndStatus(
            @Param("userId") UUID userId,
            @Param("causeId") UUID causeId,
            @Param("status") TaskStatus status);

    // Count tasks for user by cause
    @Query("""
                SELECT COUNT(t) FROM Task t
                WHERE t.cause.id = :causeId
                AND t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
            """)
    long countTasksByUserIdAndCauseId(
            @Param("userId") UUID userId,
            @Param("causeId") UUID causeId);

    // Count tasks for user by goal and status
    @Query("""
                SELECT COUNT(t) FROM Task t
                WHERE t.goal.id = :goalId
                AND t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
                AND t.status = :status
            """)
    long countTasksByUserIdAndGoalIdAndStatus(
            @Param("userId") UUID userId,
            @Param("goalId") UUID goalId,
            @Param("status") TaskStatus status);

    // Count tasks for user by goal
    @Query("""
                SELECT COUNT(t) FROM Task t
                WHERE t.goal.id = :goalId
                AND t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
            """)
    long countTasksByUserIdAndGoalId(
            @Param("userId") UUID userId,
            @Param("goalId") UUID goalId);

    // ===================== STATISTICS QUERIES =====================

    @Query("""
                SELECT new com.gooddeeds.backend.dto.TaskStatisticsDTO(
                    COUNT(t),
                    SUM(CASE WHEN t.status = com.gooddeeds.backend.model.TaskStatus.COMPLETED THEN 1 ELSE 0 END),
                    SUM(CASE WHEN t.status = com.gooddeeds.backend.model.TaskStatus.ONGOING THEN 1 ELSE 0 END),
                    SUM(CASE WHEN t.status = com.gooddeeds.backend.model.TaskStatus.COMING_UP THEN 1 ELSE 0 END)
                )
                FROM Task t
                WHERE t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
            """)
    TaskStatisticsDTO getTaskStatisticsByUserId(@Param("userId") UUID userId);

    @Query("""
                SELECT new com.gooddeeds.backend.dto.TaskStatisticsDTO(
                    COUNT(t),
                    SUM(CASE WHEN t.status = com.gooddeeds.backend.model.TaskStatus.COMPLETED THEN 1 ELSE 0 END),
                    SUM(CASE WHEN t.status = com.gooddeeds.backend.model.TaskStatus.ONGOING THEN 1 ELSE 0 END),
                    SUM(CASE WHEN t.status = com.gooddeeds.backend.model.TaskStatus.COMING_UP THEN 1 ELSE 0 END)
                )
                FROM Task t
                WHERE t.cause.id = :causeId
                AND t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
            """)
    TaskStatisticsDTO getTaskStatisticsByUserIdAndCauseId(
            @Param("userId") UUID userId,
            @Param("causeId") UUID causeId);

    @Query("""
                SELECT new com.gooddeeds.backend.dto.TaskStatisticsDTO(
                    COUNT(t),
                    SUM(CASE WHEN t.status = com.gooddeeds.backend.model.TaskStatus.COMPLETED THEN 1 ELSE 0 END),
                    SUM(CASE WHEN t.status = com.gooddeeds.backend.model.TaskStatus.ONGOING THEN 1 ELSE 0 END),
                    SUM(CASE WHEN t.status = com.gooddeeds.backend.model.TaskStatus.COMING_UP THEN 1 ELSE 0 END)
                )
                FROM Task t
                WHERE t.goal.id = :goalId
                AND t.cause.id IN (
                    SELECT m.cause.id FROM CauseMembership m
                    WHERE m.user.id = :userId AND m.approved = true
                )
            """)
    TaskStatisticsDTO getTaskStatisticsByUserIdAndGoalId(
            @Param("userId") UUID userId,
            @Param("goalId") UUID goalId);
}
