package com.unix.aiupskilling.authentication.controller;

import com.unix.aiupskilling.authentication.dto.request.LinkIntentRequest;
import com.unix.aiupskilling.authentication.dto.response.LinkIntentResponse;
import com.unix.aiupskilling.authentication.exception.InvalidCredentialsException;
import com.unix.aiupskilling.authentication.exception.OAuthLoginException;
import com.unix.aiupskilling.authentication.model.enums.OAuthProvider;
import com.unix.aiupskilling.authentication.repository.OAuthAccountRepository;
import com.unix.aiupskilling.authentication.security.oauth2.OAuthCookieHelper;
import com.unix.aiupskilling.authentication.service.OAuthLinkIntentService;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import com.unix.aiupskilling.user.User;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/oauth-links")
@RequiredArgsConstructor
public class AuthLinkController {

    private final OAuthLinkIntentService oauthLinkIntentService;
    private final OAuthAccountRepository oauthAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/{provider}/intent")
    public ResponseEntity<ApiResponse<LinkIntentResponse>> createLinkIntent(
            @PathVariable String provider,
            @RequestBody(required = false) LinkIntentRequest request,
            Authentication authentication,
            HttpServletResponse response) {

        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required"));
        }

        OAuthProvider oAuthProvider;
        try {
            oAuthProvider = OAuthProvider.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unsupported OAuth provider: " + provider);
        }

        if (oauthAccountRepository.existsByUserIdAndProvider(user.getId(), oAuthProvider)) {
            throw new OAuthLoginException("OAUTH_ALREADY_LINKED", "Provider " + oAuthProvider + " is already linked to your account");
        }

        if (user.getPasswordHash() != null) {
            if (request == null || request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                throw new InvalidCredentialsException("Current password is required to link an external account", "REAUTHENTICATION_REQUIRED");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                throw new InvalidCredentialsException("Invalid current password", "REAUTHENTICATION_REQUIRED");
            }
        }

        String rawIntent = oauthLinkIntentService.createIntent(user.getId(), oAuthProvider);

        OAuthCookieHelper.setCookie(
                response,
                OAuthCookieHelper.LINK_INTENT_COOKIE,
                rawIntent,
                "/",
                300
        );

        String authPath = "/oauth2/authorization/" + provider.toLowerCase();
        LinkIntentResponse data = LinkIntentResponse.builder()
                .authorizationPath(authPath)
                .expiresInSeconds(300)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(data, "Link intent created"));
    }
}
