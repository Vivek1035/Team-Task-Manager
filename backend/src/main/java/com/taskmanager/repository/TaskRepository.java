package com.taskmanager.repository;

import com.taskmanager.entity.Task;
import com.taskmanager.entity.User;
import com.taskmanager.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    /**
     * Admin view: all tasks in a project sorted by priority (HIGH → MEDIUM → LOW).
     */
    @Query("""
        SELECT t FROM Task t
        WHERE t.project.id = :projectId
        ORDER BY
          CASE t.priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END ASC,
          t.createdAt DESC
        """)
    Page<Task> findAllByProjectIdOrderByPriority(UUID projectId, Pageable pageable);

    /**
     * Member view: only tasks assigned to them in the project.
     */
    @Query("""
        SELECT t FROM Task t
        WHERE t.project.id = :projectId AND t.assignedTo = :user
        ORDER BY
          CASE t.priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END ASC,
          t.createdAt DESC
        """)
    Page<Task> findAllByProjectIdAndAssignedTo(UUID projectId, User user, Pageable pageable);

    // ── Stats queries ─────────────────────────────────────────────────────────
    // A task is "visible" to a user if they are ADMIN of the project (all tasks)
    // OR the task is directly assigned to them.

    @Query("""
        SELECT COUNT(t) FROM Task t
        WHERE EXISTS (
            SELECT pm FROM ProjectMember pm
            WHERE pm.project = t.project AND pm.user = :user AND pm.role = :adminRole
        ) OR t.assignedTo = :user
        """)
    long countVisibleByUser(@Param("user") User user, @Param("adminRole") Role adminRole);

    @Query("""
        SELECT COUNT(t) FROM Task t
        WHERE t.status = 'DONE'
        AND (
            EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.project = t.project AND pm.user = :user AND pm.role = :adminRole)
            OR t.assignedTo = :user
        )
        """)
    long countDoneByUser(@Param("user") User user, @Param("adminRole") Role adminRole);

    @Query("""
        SELECT COUNT(t) FROM Task t
        WHERE t.status = 'PENDING'
        AND (
            EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.project = t.project AND pm.user = :user AND pm.role = :adminRole)
            OR t.assignedTo = :user
        )
        """)
    long countPendingByUser(@Param("user") User user, @Param("adminRole") Role adminRole);

    @Query("""
        SELECT COUNT(t) FROM Task t
        WHERE t.status = 'IN_PROGRESS'
        AND (
            EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.project = t.project AND pm.user = :user AND pm.role = :adminRole)
            OR t.assignedTo = :user
        )
        """)
    long countInProgressByUser(@Param("user") User user, @Param("adminRole") Role adminRole);

    @Query("""
        SELECT COUNT(t) FROM Task t
        WHERE t.priority = 'HIGH'
        AND (
            EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.project = t.project AND pm.user = :user AND pm.role = :adminRole)
            OR t.assignedTo = :user
        )
        """)
    long countHighByUser(@Param("user") User user, @Param("adminRole") Role adminRole);

    @Query("""
        SELECT COUNT(t) FROM Task t
        WHERE t.priority = 'MEDIUM'
        AND (
            EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.project = t.project AND pm.user = :user AND pm.role = :adminRole)
            OR t.assignedTo = :user
        )
        """)
    long countMediumByUser(@Param("user") User user, @Param("adminRole") Role adminRole);

    @Query("""
        SELECT COUNT(t) FROM Task t
        WHERE t.priority = 'LOW'
        AND (
            EXISTS (SELECT pm FROM ProjectMember pm WHERE pm.project = t.project AND pm.user = :user AND pm.role = :adminRole)
            OR t.assignedTo = :user
        )
        """)
    long countLowByUser(@Param("user") User user, @Param("adminRole") Role adminRole);
}
