package com.taskmanager.dto.request;

import com.taskmanager.enums.TaskStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Used for PATCH /tasks/{id}.
 * Members can update status + progress of their assigned tasks.
 * Admins can also update title and description.
 */
public record UpdateTaskRequest(
        @NotNull(message = "Status is required") TaskStatus status,
        @Min(0) @Max(100) @NotNull int progress,
        String title,
        String description
) {}
