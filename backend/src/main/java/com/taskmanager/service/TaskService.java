package com.taskmanager.service;

import com.taskmanager.dto.request.CreateTaskRequest;
import com.taskmanager.dto.request.UpdateTaskRequest;
import com.taskmanager.dto.response.TaskResponse;
import com.taskmanager.entity.Project;
import com.taskmanager.entity.Task;
import com.taskmanager.entity.User;
import com.taskmanager.enums.Role;
import com.taskmanager.enums.TaskStatus;
import com.taskmanager.exception.AppException;
import com.taskmanager.repository.ProjectMemberRepository;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final ProjectMemberRepository memberRepository;

    @Transactional
    public TaskResponse create(CreateTaskRequest req, User creator) {
        Project project = projectService.findProjectOrThrow(req.projectId());
        projectService.requireAdmin(project, creator);

        User assignee = userRepository.findById(req.assignedToId())
            .orElseThrow(() -> AppException.notFound("Assignee not found"));

        // Assignee must belong to this project
        if (!memberRepository.existsByProjectAndUser(project, assignee)) {
            throw AppException.badRequest("Assigned user is not a member of this project");
        }

        Task task = taskRepository.save(Task.builder()
            .title(req.title())
            .description(req.description())
            .status(TaskStatus.PENDING)
            .progress(0)
            .priority(req.priority())
            .project(project)
            .createdBy(creator)
            .assignedTo(assignee)
            .build());

        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(UUID taskId, User requester) {
        Task task = findTaskOrThrow(taskId);
        projectService.requireAdmin(task.getProject(), requester);
        taskRepository.delete(task);
    }

    public Page<TaskResponse> getTasks(UUID projectId, int page, int size, User requester) {
        Project project = projectService.findProjectOrThrow(projectId);
        projectService.requireMembership(project, requester);

        PageRequest pageable = PageRequest.of(page, size);

        if (projectService.isAdmin(project, requester)) {
            return taskRepository
                .findAllByProjectIdOrderByPriority(projectId, pageable)
                .map(TaskResponse::from);
        } else {
            return taskRepository
                .findAllByProjectIdAndAssignedTo(projectId, requester, pageable)
                .map(TaskResponse::from);
        }
    }

    @Transactional
    public TaskResponse update(UUID taskId, UpdateTaskRequest req, User requester) {
        Task task = findTaskOrThrow(taskId);
        Project project = task.getProject();

        boolean isAdmin = projectService.isAdmin(project, requester);

        // Members can only update their own assigned tasks
        if (!isAdmin && !task.getAssignedTo().getId().equals(requester.getId())) {
            throw AppException.forbidden("You can only update tasks assigned to you");
        }

        // ── Business rule: status ↔ progress consistency ─────────────────────
        validateStatusProgressCombination(req.status(), req.progress());

        task.setStatus(req.status());
        task.setProgress(req.progress());

        // Admins can also rename / re-describe tasks
        if (isAdmin) {
            if (req.title() != null && !req.title().isBlank()) task.setTitle(req.title().trim());
            if (req.description() != null) task.setDescription(req.description().trim());
        }

        return TaskResponse.from(taskRepository.save(task));
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /** Returns dashboard statistics for all tasks visible to the given user. */
    public Map<String, Long> getStats(User user) {
        return Map.of(
            "total",      taskRepository.countVisibleByUser(user, Role.ADMIN),
            "done",       taskRepository.countDoneByUser(user, Role.ADMIN),
            "pending",    taskRepository.countPendingByUser(user, Role.ADMIN),
            "inProgress", taskRepository.countInProgressByUser(user, Role.ADMIN),
            "high",       taskRepository.countHighByUser(user, Role.ADMIN),
            "medium",     taskRepository.countMediumByUser(user, Role.ADMIN),
            "low",        taskRepository.countLowByUser(user, Role.ADMIN)
        );
    }

    private Task findTaskOrThrow(UUID taskId) {
        return taskRepository.findById(taskId)
            .orElseThrow(() -> AppException.notFound("Task not found"));
    }

    /**
     * Enforces the mandatory business rules:
     *   PENDING    → progress must be 0
     *   IN_PROGRESS→ progress must be 1–99
     *   DONE       → progress must be 100
     */
    private void validateStatusProgressCombination(TaskStatus status, int progress) {
        switch (status) {
            case PENDING -> {
                if (progress != 0)
                    throw AppException.badRequest("PENDING tasks must have progress = 0");
            }
            case IN_PROGRESS -> {
                if (progress < 1 || progress > 99)
                    throw AppException.badRequest("IN_PROGRESS tasks must have progress between 1 and 99");
            }
            case DONE -> {
                if (progress != 100)
                    throw AppException.badRequest("DONE tasks must have progress = 100");
            }
        }
    }
}
