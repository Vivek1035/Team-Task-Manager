package com.taskmanager.dto.response;

import com.taskmanager.entity.User;
import com.taskmanager.enums.AuthProvider;
import com.taskmanager.enums.Role;

import java.util.UUID;

public record UserResponse(UUID id, String name, String email, AuthProvider provider, Role role) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getProvider(),
                user.getRole() != null ? user.getRole() : Role.MEMBER);
    }
}
