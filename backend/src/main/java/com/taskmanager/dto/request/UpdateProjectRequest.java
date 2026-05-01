package com.taskmanager.dto.request;

import com.taskmanager.enums.Priority;
import jakarta.validation.constraints.NotBlank;

public record UpdateProjectRequest(
        @NotBlank(message = "Project name is required") String name,
        String description,
        Priority priority
) {}
