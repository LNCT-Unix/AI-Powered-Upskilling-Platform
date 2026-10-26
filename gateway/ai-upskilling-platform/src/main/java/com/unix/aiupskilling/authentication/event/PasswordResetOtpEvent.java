package com.unix.aiupskilling.authentication.event;

public record PasswordResetOtpEvent(String email, String fullName, String otp) {
}
