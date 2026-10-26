package com.unix.aiupskilling.authentication.service;

import com.unix.aiupskilling.user.User;

public interface EmailVerificationService {

    String issueToken(User user);

    void confirmToken(String rawToken);

    boolean canResend(User user);

    void invalidateAllForUser(Long userId);
}
