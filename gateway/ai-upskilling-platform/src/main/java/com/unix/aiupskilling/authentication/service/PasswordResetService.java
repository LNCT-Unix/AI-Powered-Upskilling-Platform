package com.unix.aiupskilling.authentication.service;

import com.unix.aiupskilling.authentication.dto.request.ForgotPasswordRequest;
import com.unix.aiupskilling.authentication.dto.request.ResetPasswordRequest;
import com.unix.aiupskilling.authentication.dto.request.VerifyResetOtpRequest;
import com.unix.aiupskilling.authentication.dto.response.VerifyResetOtpResponse;

public interface PasswordResetService {

    void forgotPassword(ForgotPasswordRequest request, String clientIp);

    VerifyResetOtpResponse verifyResetOtp(VerifyResetOtpRequest request);

    void resetPassword(ResetPasswordRequest request);
}
