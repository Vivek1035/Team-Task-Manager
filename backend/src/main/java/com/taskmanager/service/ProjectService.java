package com.taskmanager.service;

import com.taskmanager.dto.request.AddMemberRequest;
import com.taskmanager.dto.request.CreateProjectRequest;
import com.taskmanager.dto.request.UpdateProjectRequest;
import com.taskmanager.dto.response.ProjectResponse;
import com.taskmanager.entity.Project;
import com.taskmanager.entity.ProjectMember;
import com.taskmanager.entity.User;
import com.taskmanager.enums.Role;
import com.taskmanager.exception.AppException;
import com.taskmanager.repository.ProjectMemberRepository;
import com.taskmanager.repository.ProjectRepository;
import com.taskmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProjectResponse create(CreateProjectRequest req, User creator) {
        Project project = projectRepository.save(Project.builder()
            .name(req.name())
            .description(req.description())
            .priority(req.priority())
            .createdBy(creator)
            .build());

        // Creator automatically becomes ADMIN member
        memberRepository.save(ProjectMember.builder()
            .project(project)
            .user(creator)
            .role(Role.ADMIN)
            .build());

        return ProjectResponse.from(project);
    }

    @Transactional
    public void delete(UUID projectId, User requester) {
        Project project = findProjectOrThrow(projectId);
        requireAdmin(project, requester);
        projectRepository.delete(project);
    }

    @Transactional
    public ProjectResponse update(UUID projectId, UpdateProjectRequest req, User requester) {
        Project project = findProjectOrThrow(projectId);
        requireAdmin(project, requester);
        project.setName(req.name());
        // Only overwrite description if explicitly provided (non-null)
        if (req.description() != null) project.setDescription(req.description());
        if (req.priority() != null)    project.setPriority(req.priority());
        return ProjectResponse.from(projectRepository.save(project));
    }

    public List<ProjectResponse> getMyProjects(User user) {
        return projectRepository.findAllByMember(user)
            .stream()
            .map(ProjectResponse::from)
            .toList();
    }

    @Transactional
    public void addMember(UUID projectId, AddMemberRequest req, User requester) {
        Project project = findProjectOrThrow(projectId);
        requireAdmin(project, requester);

        User newMember = userRepository.findByEmail(req.email())
            .orElseThrow(() -> AppException.notFound("No user found with email: " + req.email()));

        if (memberRepository.existsByProjectAndUser(project, newMember)) {
            throw AppException.conflict("User is already a member of this project");
        }

        memberRepository.save(ProjectMember.builder()
            .project(project)
            .user(newMember)
            .role(Role.MEMBER)
            .build());
    }

    // ── Helpers used by TaskService too ─────────────────────────────────────

    public Project findProjectOrThrow(UUID projectId) {
        return projectRepository.findById(projectId)
            .orElseThrow(() -> AppException.notFound("Project not found"));
    }

    public void requireAdmin(Project project, User user) {
        if (!memberRepository.existsByProjectAndUserAndRole(project, user, Role.ADMIN)) {
            throw AppException.forbidden("Admin access required");
        }
    }

    public void requireMembership(Project project, User user) {
        if (!memberRepository.existsByProjectAndUser(project, user)) {
            throw AppException.forbidden("You are not a member of this project");
        }
    }

    public boolean isAdmin(Project project, User user) {
        return memberRepository.existsByProjectAndUserAndRole(project, user, Role.ADMIN);
    }
}
