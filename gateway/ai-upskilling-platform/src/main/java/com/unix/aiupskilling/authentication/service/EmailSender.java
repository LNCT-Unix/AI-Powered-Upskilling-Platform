package com.unix.aiupskilling.authentication.service;

public interface EmailSender {

    void sendVerificationEmail(String toEmail, String fullName, String rawToken);

    void sendPasswordResetOtpEmail(String toEmail, String fullName, String otp);
}
