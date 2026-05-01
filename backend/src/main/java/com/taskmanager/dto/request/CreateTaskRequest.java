package com.taskmanager.dto.request;

import com.taskmanager.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateTaskRequest(
        @NotBlank(message = "Title is required") String title,
        String description,
        @NotNull(message = "Priority is required") Priority priority,
        @NotNull(message = "Project ID is required") UUID projectId,
        @NotNull(message = "Assigned user is required") UUID assignedToId
) {}
