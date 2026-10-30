package com.unix.aiupskilling.authentication.service;

import com.unix.aiupskilling.authentication.dto.request.MentorRegisterRequest;
import com.unix.aiupskilling.authentication.dto.response.RegistrationAcceptedResponse;

public interface MentorAuthService {

    RegistrationAcceptedResponse register(MentorRegisterRequest request, String clientIp);
}

