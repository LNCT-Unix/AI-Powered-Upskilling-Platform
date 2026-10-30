package com.unix.aiupskilling.authentication.controller;

import com.unix.aiupskilling.authentication.config.AuthProperties;
import com.unix.aiupskilling.authentication.dto.request.ExchangeLoginCodeRequest;
import com.unix.aiupskilling.authentication.dto.request.RefreshTokenRequest;
import com.unix.aiupskilling.authentication.dto.response.AuthTokens;
import com.unix.aiupskilling.authentication.dto.response.AuthTokensResponse;
import com.unix.aiupskilling.authentication.exception.InvalidRefreshTokenException;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import com.unix.aiupskilling.authentication.security.oauth2.OAuthCookieHelper;
import com.unix.aiupskilling.authentication.service.AccountEligibilityService;
import com.unix.aiupskilling.authentication.service.AuthTokenService;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import com.unix.aiupskilling.user.UserResponse;
import com.unix.aiupskilling.shared.exception.ResourceNotFoundException;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthTokenController {

    private final AuthTokenService authTokenService;
    private final AuthProperties authProperties;
    private final UserRepository userRepository;
    private final AccountEligibilityService accountEligibilityService;

    @PostMapping("/oauth2/exchange")
    public ResponseEntity<ApiResponse<AuthTokensResponse>> exchangeCode(
            @Valid @RequestBody ExchangeLoginCodeRequest request,
            @RequestHeader(value = "X-Client-Platform", required = false) String platformHeader,
            HttpServletResponse response) {

        AuthTokens tokens = authTokenService.exchangeLoginCode(request.getCode());
        boolean isMobile = "mobile".equalsIgnoreCase(platformHeader);

        if (!isMobile) {
            OAuthCookieHelper.setCookie(
                    response,
                    OAuthCookieHelper.REFRESH_TOKEN_COOKIE,
                    tokens.getRefreshToken(),
                    "/api/auth",
                    authProperties.getJwt().getRefreshTokenTtlSeconds()
            );
            tokens.setRefreshToken(null);
        }

        return ResponseEntity.ok(ApiResponse.ok(AuthTokensResponse.from(tokens), "Login successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthTokensResponse>> refresh(
            @RequestBody(required = false) RefreshTokenRequest requestBody,
            @RequestHeader(value = "X-Client-Platform", required = false) String platformHeader,
            HttpServletRequest request,
            HttpServletResponse response) {

        boolean isMobile = "mobile".equalsIgnoreCase(platformHeader);
        String rawToken = null;

        if (isMobile && requestBody != null && requestBody.getRefreshToken() != null) {
            rawToken = requestBody.getRefreshToken();
        } else {
            rawToken = OAuthCookieHelper.getCookieValue(request, OAuthCookieHelper.REFRESH_TOKEN_COOKIE).orElse(null);
            if (rawToken == null && requestBody != null) {
                rawToken = requestBody.getRefreshToken();
            }
            validateOriginIfPresent(request);
        }

        if (rawToken == null || rawToken.isBlank()) {
            throw new InvalidRefreshTokenException("Refresh token is missing");
        }

        ClientPlatform platform = isMobile ? ClientPlatform.MOBILE : ClientPlatform.WEB;
        AuthTokens tokens = authTokenService.refresh(rawToken, platform);

        if (!isMobile) {
            OAuthCookieHelper.setCookie(
                    response,
                    OAuthCookieHelper.REFRESH_TOKEN_COOKIE,
                    tokens.getRefreshToken(),
                    "/api/auth",
                    authProperties.getJwt().getRefreshTokenTtlSeconds()
            );
            tokens.setRefreshToken(null);
        }

        return ResponseEntity.ok(ApiResponse.ok(AuthTokensResponse.from(tokens), "Token refresh successful"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestBody(required = false) RefreshTokenRequest requestBody,
            HttpServletRequest request,
            HttpServletResponse response) {

        validateOriginIfPresent(request);

        String rawToken = OAuthCookieHelper.getCookieValue(request, OAuthCookieHelper.REFRESH_TOKEN_COOKIE).orElse(null);
        if (rawToken == null && requestBody != null) {
            rawToken = requestBody.getRefreshToken();
        }

        if (rawToken != null && !rawToken.isBlank()) {
            authTokenService.revoke(rawToken);
        }

        OAuthCookieHelper.clearCookie(response, OAuthCookieHelper.REFRESH_TOKEN_COOKIE, "/api/auth");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User userPrincipal)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized"));
        }

        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userPrincipal.getId()));

        accountEligibilityService.assertCanAuthenticate(user);

        UserResponse response = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .build();

        return ResponseEntity.ok(ApiResponse.ok(response, "OK"));
    }

    private void validateOriginIfPresent(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            boolean allowed = authProperties.getCors().getAllowedOrigins().contains(origin);
            if (!allowed) {
                throw new AccessDeniedException("Disallowed origin: " + origin);
            }
        }
    }
}
