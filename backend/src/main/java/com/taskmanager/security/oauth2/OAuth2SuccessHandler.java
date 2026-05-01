package com.taskmanager.security.oauth2;

import com.taskmanager.repository.UserRepository;
import com.taskmanager.security.JwtUtil;
import com.taskmanager.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * After successful Google login, issues a JWT and redirects to the frontend
 * with the token in the query string.
 * Frontend: /oauth/callback?token=<jwt>
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        Object principalObj = authentication.getPrincipal();

        User user;

        if (principalObj instanceof CustomOAuth2User customUser) {
            user = customUser.getUser();

        } else if (principalObj instanceof OAuth2User oauth2User) {
            String email = (String) oauth2User.getAttributes().get("email");

            if (email == null) {
                throw new IllegalStateException("Email not found in OAuth2 response");
            }

            // you NEED this dependency
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalStateException("User not found in DB"));

        } else {
            throw new IllegalStateException("Unsupported principal type: " + principalObj.getClass());
        }

        String token = jwtUtil.generateToken(user);
        System.out.println("PRINCIPAL CLASS: " + authentication.getPrincipal().getClass());
        String redirectUrl = frontendUrl + "/oauth/callback#token=" + token;

        clearAuthenticationAttributes(request);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}