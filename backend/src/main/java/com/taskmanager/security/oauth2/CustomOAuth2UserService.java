package com.taskmanager.security.oauth2;

import com.taskmanager.entity.User;
import com.taskmanager.enums.Role;
import com.taskmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Called by Spring after successful Google OAuth.
 * Find-or-create pattern: if the email exists, return that user; else create
 * one.
 */
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = super.loadUser(request);
        Map<String, Object> attributes = oauthUser.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");

        System.out.println("EMAIL FROM GOOGLE: " + email);

        if (email == null) {
            throw new OAuth2AuthenticationException("Email not found from OAuth provider");
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = userRepository.save(
                    User.builder()
                            .email(email)
                            .name(name)
                            .role(Role.MEMBER)
                            .provider("GOOGLE")
                            .build());
        } else {
            // optional update
            if (user.getName() == null) {
                user.setName(name);
                userRepository.save(user);
            }
        }

        return new CustomOAuth2User(user, attributes);
    }
}