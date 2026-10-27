package com.unix.aiupskilling.authentication.service;

import com.unix.aiupskilling.user.User;

public interface EmailVerificationService {

    String issueOtp(User user);

    void verifyOtp(String email, String otp);

    boolean canResend(User user);

    void invalidateAllForUser(Long userId);

    default String issueToken(User user) {
        return issueOtp(user);
    }

    default void confirmToken(String rawToken) {
        throw new UnsupportedOperationException("confirmToken is deprecated. Use verifyOtp(email, otp)");
    }
}
