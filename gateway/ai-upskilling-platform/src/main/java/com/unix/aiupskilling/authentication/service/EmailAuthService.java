package com.unix.aiupskilling.authentication.service;

import com.unix.aiupskilling.authentication.dto.request.ConfirmEmailRequest;
import com.unix.aiupskilling.authentication.dto.request.LoginRequest;
import com.unix.aiupskilling.authentication.dto.request.RegisterRequest;
import com.unix.aiupskilling.authentication.dto.request.ResendVerificationRequest;
import com.unix.aiupskilling.authentication.dto.response.AuthTokens;
import com.unix.aiupskilling.authentication.dto.response.RegistrationAcceptedResponse;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;

public interface EmailAuthService {

    RegistrationAcceptedResponse register(RegisterRequest request, String clientIp);

    AuthTokens confirmEmail(ConfirmEmailRequest request, ClientPlatform platform);

    RegistrationAcceptedResponse resendVerification(ResendVerificationRequest request, String clientIp);

    AuthTokens login(LoginRequest request, ClientPlatform platform, String clientIp);
}
