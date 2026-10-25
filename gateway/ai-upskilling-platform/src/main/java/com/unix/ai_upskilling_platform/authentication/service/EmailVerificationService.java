package com.unix.ai_upskilling_platform.authentication.service;

import com.unix.ai_upskilling_platform.model.entity.User;

public interface EmailVerificationService {

    String issueToken(User user);

    void confirmToken(String rawToken);

    boolean canResend(User user);

    void invalidateAllForUser(Long userId);
}
