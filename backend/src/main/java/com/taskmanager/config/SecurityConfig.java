package com.taskmanager.config;

import java.util.List;

import com.taskmanager.security.JwtAuthFilter;
import com.taskmanager.security.CustomUserDetailsService;
import com.taskmanager.security.oauth2.CustomOAuth2UserService;
import com.taskmanager.security.oauth2.CustomOidcUserService;
import com.taskmanager.security.oauth2.OAuth2SuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthFilter jwtAuthFilter;
        private final CorsProperties corsProperties;
        private final CustomOAuth2UserService customOAuth2UserService;
        private final CustomOidcUserService customOidcUserService;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http,
                        OAuth2SuccessHandler oAuth2SuccessHandler) throws Exception {

                http
                                .csrf(csrf -> csrf.disable())

                                .cors(Customizer.withDefaults())

                                .sessionManagement(sm -> sm
                                                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers("/auth/login", "/auth/register").permitAll()
                                                .requestMatchers("/oauth2/authorization/**", "/login/oauth2/code/**")
                                                .permitAll()
                                                .requestMatchers("/", "/error", "/favicon.ico").permitAll()
                                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                                                .requestMatchers("/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/tasks/**").hasAnyRole("ADMIN", "MEMBER")
                                                .anyRequest().authenticated())

                                .oauth2Login(oauth -> oauth
                                                .userInfoEndpoint(info -> info
                                                                .userService(customOAuth2UserService)
                                                                .oidcUserService(customOidcUserService))
                                                .successHandler(oAuth2SuccessHandler)
                                                .failureHandler((request, response, exception) -> {
                                                        // This will tell us exactly what's failing
                                                        System.out.println("OAuth2 FAILURE: "
                                                                        + exception.getClass().getName() + " - "
                                                                        + exception.getMessage());
                                                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                                        response.getWriter().write(
                                                                        "OAuth2 failed: " + exception.getMessage());
                                                }))

                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint((req, res, e) -> {
                                                        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                                        res.getWriter().write("Unauthorized");
                                                }))

                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(corsProperties.getAllowedOrigins());
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }
}