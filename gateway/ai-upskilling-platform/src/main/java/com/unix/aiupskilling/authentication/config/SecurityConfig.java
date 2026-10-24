package com.unix.aiupskilling.authentication.config;

import com.unix.aiupskilling.authentication.security.oauth2.CustomOAuth2AuthorizationRequestResolver;
import com.unix.aiupskilling.authentication.security.oauth2.GitHubOAuth2UserService;
import com.unix.aiupskilling.authentication.security.oauth2.GoogleOidcUserService;
import com.unix.aiupskilling.authentication.security.oauth2.OAuth2LoginFailureHandler;
import com.unix.aiupskilling.authentication.security.oauth2.OAuth2LoginSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AuthProperties authProperties;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JsonAuthenticationEntryPoint jsonAuthenticationEntryPoint;
    private final JsonAccessDeniedHandler jsonAccessDeniedHandler;
    private final GoogleOidcUserService googleOidcUserService;
    private final GitHubOAuth2UserService gitHubOAuth2UserService;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final OAuth2LoginFailureHandler oAuth2LoginFailureHandler;
    private final ObjectProvider<ClientRegistrationRepository> clientRegistrationRepositoryProvider;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    @Order(1)
    public SecurityFilterChain oauthFilterChain(HttpSecurity http) throws Exception {
        http
                .securityMatcher("/oauth2/**", "/login/oauth2/**")
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jsonAuthenticationEntryPoint)
                        .accessDeniedHandler(jsonAccessDeniedHandler)
                );

        ClientRegistrationRepository clientRepo = clientRegistrationRepositoryProvider.getIfAvailable();
        if (clientRepo != null) {
            http.oauth2Login(oauth -> {
                oauth.authorizationEndpoint(authEndpoint ->
                        authEndpoint.authorizationRequestResolver(new CustomOAuth2AuthorizationRequestResolver(clientRepo))
                );
                oauth.userInfoEndpoint(userInfo -> {
                    userInfo.oidcUserService(googleOidcUserService);
                    userInfo.userService(gitHubOAuth2UserService);
                });
                oauth.successHandler(oAuth2LoginSuccessHandler);
                oauth.failureHandler(oAuth2LoginFailureHandler);
            });
        }

        return http.build();
    }

    @Bean
    @Order(2)
    public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
        http
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jsonAuthenticationEntryPoint)
                        .accessDeniedHandler(jsonAccessDeniedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/email-verification/**",
                                "/api/auth/refresh",
                                "/api/auth/logout",
                                "/api/auth/oauth2/exchange",
                                "/oauth2/**",
                                "/login/oauth2/**",
                                "/error",
                                "/health",
                                "/actuator/health"
                        ).permitAll()
                        // Protected endpoints
                        .requestMatchers("/api/auth/me", "/api/auth/oauth-links/**").authenticated()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().denyAll()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> allowedOrigins = authProperties.getCors().getAllowedOrigins();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Client-Platform", "Origin", "Accept"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
