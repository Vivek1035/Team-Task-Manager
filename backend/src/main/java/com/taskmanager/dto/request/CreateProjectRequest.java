package com.taskmanager.dto.request;

import com.taskmanager.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateProjectRequest(
        @NotBlank(message = "Project name is required") String name,
        String description,
        @NotNull(message = "Priority is required") Priority priority
) {}
