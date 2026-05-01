package com.taskmanager.dto.response;

import com.taskmanager.entity.User;

import java.util.UUID;

public record UserResponse(UUID id, String name, String email, String provider, String role) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getProvider(),
            user.getRole() != null ? user.getRole().name() : "MEMBER"
        );
    }
}
