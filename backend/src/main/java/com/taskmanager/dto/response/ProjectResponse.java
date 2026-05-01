package com.taskmanager.dto.response;

import com.taskmanager.entity.Project;
import com.taskmanager.enums.Priority;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        String name,
        String description,
        Priority priority,
        UUID createdById,
        String createdByName,
        LocalDateTime createdAt
) {
    public static ProjectResponse from(Project p) {
        return new ProjectResponse(
            p.getId(),
            p.getName(),
            p.getDescription(),
            p.getPriority(),
            p.getCreatedBy().getId(),
            p.getCreatedBy().getName(),
            p.getCreatedAt()
        );
    }
}
