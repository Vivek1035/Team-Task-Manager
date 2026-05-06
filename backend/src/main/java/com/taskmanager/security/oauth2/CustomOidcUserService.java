package com.taskmanager.security.oauth2;

import com.taskmanager.entity.User;
import com.taskmanager.enums.AuthProvider;
import com.taskmanager.enums.Role;
import com.taskmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOidcUserService extends OidcUserService {

    private final UserRepository userRepository;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);
        Map<String, Object> attributes = oidcUser.getAttributes();

        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        Boolean emailVerified = (Boolean) attributes.get("email_verified");

        System.out.println("EMAIL FROM GOOGLE OIDC: " + email);

        if (email == null || Boolean.FALSE.equals(emailVerified)) {
            throw new OAuth2AuthenticationException("Invalid or unverified email from provider");
        }

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = userRepository.save(
                    User.builder()
                            .email(email)
                            .name(name)
                            .role(Role.MEMBER)
                            .provider(AuthProvider.GOOGLE)
                            .build());
        } else {
            // Existing user -> unify account
            if (user.getProvider() == AuthProvider.LOCAL) {
                user.setProvider(AuthProvider.GOOGLE);
            }
            user.setName(name);
            userRepository.save(user);
        }

        return new CustomOidcUser(user, oidcUser);
    }
}
