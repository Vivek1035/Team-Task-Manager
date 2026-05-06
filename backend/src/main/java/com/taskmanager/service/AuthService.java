package com.taskmanager.service;

import com.taskmanager.dto.request.LoginRequest;
import com.taskmanager.dto.request.RegisterRequest;
import com.taskmanager.dto.response.AuthResponse;
import com.taskmanager.dto.response.UserResponse;
import com.taskmanager.entity.User;
import com.taskmanager.enums.Role;
import com.taskmanager.enums.AuthProvider;
import com.taskmanager.exception.AppException;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw AppException.conflict("Email already registered");
        }

        User user = userRepository.save(User.builder()
                .name(req.name())
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .role(Role.MEMBER) // default role for self-registered users
                .provider(AuthProvider.LOCAL)
                .build());

        return new AuthResponse(jwtUtil.generateToken(user), UserResponse.from(user));
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> AppException.unauthorized("Invalid email or password"));

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw AppException.badRequest("This account uses Google login. Please sign in with Google.");
        }

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw AppException.unauthorized("Invalid email or password");
        }

        return new AuthResponse(jwtUtil.generateToken(user), UserResponse.from(user));
    }
}
