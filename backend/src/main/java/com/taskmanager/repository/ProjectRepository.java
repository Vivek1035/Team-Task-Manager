package com.taskmanager.repository;

import com.taskmanager.entity.Project;
import com.taskmanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    /**
     * Returns all projects where the given user is a member (any role).
     * Ordered by project name for stable display.
     */
    @Query("""
        SELECT p FROM Project p
        JOIN ProjectMember pm ON pm.project = p
        WHERE pm.user = :user
        ORDER BY p.name ASC
        """)
    List<Project> findAllByMember(User user);
}
