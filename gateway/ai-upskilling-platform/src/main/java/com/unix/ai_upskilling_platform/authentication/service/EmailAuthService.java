package com.unix.ai_upskilling_platform.authentication.service;

import com.unix.ai_upskilling_platform.authentication.dto.request.ConfirmEmailRequest;
import com.unix.ai_upskilling_platform.authentication.dto.request.LoginRequest;
import com.unix.ai_upskilling_platform.authentication.dto.request.RegisterRequest;
import com.unix.ai_upskilling_platform.authentication.dto.request.ResendVerificationRequest;
import com.unix.ai_upskilling_platform.authentication.dto.response.AuthTokens;
import com.unix.ai_upskilling_platform.authentication.dto.response.RegistrationAcceptedResponse;
import com.unix.ai_upskilling_platform.authentication.model.enums.ClientPlatform;

public interface EmailAuthService {

    RegistrationAcceptedResponse register(RegisterRequest request, String clientIp);

    void confirmEmail(ConfirmEmailRequest request);

    RegistrationAcceptedResponse resendVerification(ResendVerificationRequest request, String clientIp);

    AuthTokens login(LoginRequest request, ClientPlatform platform, String clientIp);
}
