package com.taskmanager.security.oauth2;

import com.taskmanager.security.JwtUtil;
import com.taskmanager.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
// import org.springframework.security.oauth2.core.user.OAuth2User;
import com.taskmanager.security.oauth2.CustomOAuth2User;
import com.taskmanager.security.oauth2.CustomOidcUser;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
// import java.util.Map;

/**
 * After successful Google login, issues a JWT and redirects to the frontend
 * with the token in the query string.
 * Frontend: /oauth/callback?token=<jwt>
 */
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final JwtUtil jwtUtil;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        Object principal = authentication.getPrincipal();
        User user;

        if (principal instanceof CustomOAuth2User customUser) {
            user = customUser.getUser();
        } else if (principal instanceof CustomOidcUser customOidcUser) {
            user = customOidcUser.getUser();
        } else {
            throw new IllegalStateException("OAuth2 principal is not CustomOAuth2User or CustomOidcUser");
        }

        System.out.println("PRINCIPAL: " + authentication.getPrincipal().getClass());

        String token = jwtUtil.generateToken(user);
        String redirectUrl = frontendUrl + "/oauth/callback#token=" + token;

        clearAuthenticationAttributes(request);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}