package com.taskmanager.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Name is required") String name,
        @Email(message = "Valid email required") @NotBlank String email,
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password
) {}
