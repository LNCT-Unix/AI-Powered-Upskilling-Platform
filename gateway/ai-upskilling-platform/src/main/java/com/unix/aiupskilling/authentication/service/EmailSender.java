package com.unix.aiupskilling.authentication.service;

public interface EmailSender {

    void sendVerificationEmail(String toEmail, String fullName, String otp);

    void sendPasswordResetOtpEmail(String toEmail, String fullName, String otp);
}
