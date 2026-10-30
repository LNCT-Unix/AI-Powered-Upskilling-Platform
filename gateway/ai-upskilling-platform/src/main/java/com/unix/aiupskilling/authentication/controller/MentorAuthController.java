package com.unix.aiupskilling.authentication.controller;

import com.unix.aiupskilling.authentication.dto.request.MentorRegisterRequest;
import com.unix.aiupskilling.authentication.dto.response.RegistrationAcceptedResponse;
import com.unix.aiupskilling.authentication.service.MentorAuthService;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/mentor")
@RequiredArgsConstructor
public class MentorAuthController {

    private final MentorAuthService mentorAuthService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegistrationAcceptedResponse>> register(
            @Valid @RequestBody MentorRegisterRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        RegistrationAcceptedResponse response = mentorAuthService.register(request, clientIp);

        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok(response, "If the email is eligible, a 6-digit verification code has been sent."));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

