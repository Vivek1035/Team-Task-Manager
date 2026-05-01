package com.taskmanager.controller;

import com.taskmanager.dto.request.AddMemberRequest;
import com.taskmanager.dto.request.CreateProjectRequest;
import com.taskmanager.dto.request.UpdateProjectRequest;
import com.taskmanager.dto.response.ProjectResponse;
import com.taskmanager.entity.Project;
import com.taskmanager.enums.Role;
import com.taskmanager.repository.ProjectMemberRepository;
import com.taskmanager.security.CustomUserDetails;
import com.taskmanager.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectMemberRepository memberRepository;

    @PostMapping
    public ResponseEntity<ProjectResponse> create(
            @Valid @RequestBody CreateProjectRequest req,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(projectService.create(req, principal.getUser()));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProjectResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProjectRequest req,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(projectService.update(id, req, principal.getUser()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        projectService.delete(id, principal.getUser());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getMyProjects(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(projectService.getMyProjects(principal.getUser()));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<Void> addMember(
            @PathVariable UUID id,
            @Valid @RequestBody AddMemberRequest req,
            @AuthenticationPrincipal CustomUserDetails principal) {
        projectService.addMember(id, req, principal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** Returns the calling user's role in the given project ("ADMIN" or "MEMBER"). */
    @GetMapping("/{id}/my-role")
    public ResponseEntity<Map<String, String>> getMyRole(
            @PathVariable UUID id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        Project project = projectService.findProjectOrThrow(id);
        boolean isAdmin = memberRepository.existsByProjectAndUserAndRole(
                project, principal.getUser(), Role.ADMIN);
        return ResponseEntity.ok(Map.of("role", isAdmin ? "ADMIN" : "MEMBER"));
    }
}
