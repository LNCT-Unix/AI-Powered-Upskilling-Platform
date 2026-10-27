package com.unix.aiupskilling.authentication.event;

public record EmailVerificationEvent(String email, String fullName, String otp) {
}
