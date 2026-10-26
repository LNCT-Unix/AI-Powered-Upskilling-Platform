package com.unix.aiupskilling.authentication.controller;

import com.unix.aiupskilling.authentication.dto.request.ForgotPasswordRequest;
import com.unix.aiupskilling.authentication.dto.request.ResetPasswordRequest;
import com.unix.aiupskilling.authentication.dto.request.VerifyResetOtpRequest;
import com.unix.aiupskilling.authentication.dto.response.VerifyResetOtpResponse;
import com.unix.aiupskilling.authentication.service.PasswordResetService;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {

        String clientIp = resolveClientIp(httpRequest);
        passwordResetService.forgotPassword(request, clientIp);

        return ResponseEntity.ok(ApiResponse.ok(null, "If an account exists with this email, a password reset code has been sent."));
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<ApiResponse<VerifyResetOtpResponse>> verifyResetOtp(
            @Valid @RequestBody VerifyResetOtpRequest request) {

        VerifyResetOtpResponse response = passwordResetService.verifyResetOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(response, "OTP verified successfully."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        passwordResetService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Password has been reset successfully."));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
