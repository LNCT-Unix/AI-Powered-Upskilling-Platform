package com.unix.ai_upskilling_platform.authentication.service;

public interface EmailSender {

    void sendVerificationEmail(String toEmail, String fullName, String rawToken);
}
