package com.taskmanager.dto.response;

import com.taskmanager.entity.Task;
import com.taskmanager.enums.Priority;
import com.taskmanager.enums.TaskStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        String title,
        String description,
        TaskStatus status,
        int progress,
        Priority priority,
        UUID projectId,
        UUID createdById,
        String createdByName,
        UUID assignedToId,
        String assignedToName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static TaskResponse from(Task t) {
        return new TaskResponse(
            t.getId(),
            t.getTitle(),
            t.getDescription(),
            t.getStatus(),
            t.getProgress(),
            t.getPriority(),
            t.getProject().getId(),
            t.getCreatedBy().getId(),
            t.getCreatedBy().getName(),
            t.getAssignedTo().getId(),
            t.getAssignedTo().getName(),
            t.getCreatedAt(),
            t.getUpdatedAt()
        );
    }
}
