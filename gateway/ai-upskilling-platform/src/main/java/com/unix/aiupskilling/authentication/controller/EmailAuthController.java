package com.unix.aiupskilling.authentication.controller;

import com.unix.aiupskilling.authentication.config.AuthProperties;
import com.unix.aiupskilling.authentication.dto.request.ConfirmEmailRequest;
import com.unix.aiupskilling.authentication.dto.request.LoginRequest;
import com.unix.aiupskilling.authentication.dto.request.RegisterRequest;
import com.unix.aiupskilling.authentication.dto.request.ResendVerificationRequest;
import com.unix.aiupskilling.authentication.dto.response.AuthTokens;
import com.unix.aiupskilling.authentication.dto.response.AuthTokensResponse;
import com.unix.aiupskilling.authentication.dto.response.RegistrationAcceptedResponse;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import com.unix.aiupskilling.authentication.security.oauth2.OAuthCookieHelper;
import com.unix.aiupskilling.authentication.service.EmailAuthService;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class EmailAuthController {

    private final EmailAuthService emailAuthService;
    private final AuthProperties authProperties;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegistrationAcceptedResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        RegistrationAcceptedResponse response = emailAuthService.register(request, clientIp);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok(response, "If the email is eligible, a verification link has been sent."));
    }

    @PostMapping("/email-verification/confirm")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> confirm(
            @Valid @RequestBody ConfirmEmailRequest request) {

        emailAuthService.confirmEmail(request);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("emailVerified", true), "Email verified successfully"));
    }

    @PostMapping("/email-verification/resend")
    public ResponseEntity<ApiResponse<RegistrationAcceptedResponse>> resend(
            @Valid @RequestBody ResendVerificationRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        RegistrationAcceptedResponse response = emailAuthService.resendVerification(request, clientIp);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok(response, "If the email is eligible, a verification link has been sent."));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthTokensResponse>> login(
            @Valid @RequestBody LoginRequest request,
            @RequestHeader(value = "X-Client-Platform", required = false) String platformHeader,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        boolean isMobile = "mobile".equalsIgnoreCase(platformHeader);
        ClientPlatform platform = isMobile ? ClientPlatform.MOBILE : ClientPlatform.WEB;
        String clientIp = resolveClientIp(httpRequest);

        AuthTokens tokens = emailAuthService.login(request, platform, clientIp);

        if (!isMobile) {
            OAuthCookieHelper.setCookie(
                    httpResponse,
                    OAuthCookieHelper.REFRESH_TOKEN_COOKIE,
                    tokens.getRefreshToken(),
                    "/api/auth",
                    authProperties.getJwt().getRefreshTokenTtlSeconds()
            );
            tokens.setRefreshToken(null);
        }

        return ResponseEntity.ok(ApiResponse.ok(AuthTokensResponse.from(tokens), "Login successful"));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
