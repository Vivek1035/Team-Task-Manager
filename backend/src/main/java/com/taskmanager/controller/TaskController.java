package com.taskmanager.controller;

import com.taskmanager.dto.request.CreateTaskRequest;
import com.taskmanager.dto.request.UpdateTaskRequest;
import com.taskmanager.dto.response.TaskResponse;
import com.taskmanager.security.CustomUserDetails;
import com.taskmanager.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @Valid @RequestBody CreateTaskRequest req,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(taskService.create(req, principal.getUser()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        taskService.delete(id, principal.getUser());
        return ResponseEntity.noContent().build();
    }

    /** Dashboard stats: counts by status and priority visible to the calling user. */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(taskService.getStats(principal.getUser()));
    }

    @GetMapping
    public ResponseEntity<Page<TaskResponse>> getTasks(
            @RequestParam UUID projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(taskService.getTasks(projectId, page, size, principal.getUser()));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TaskResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaskRequest req,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(taskService.update(id, req, principal.getUser()));
    }
}
