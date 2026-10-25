package com.unix.ai_upskilling_platform.authentication.event;

public record EmailVerificationEvent(String email, String fullName, String rawToken) {
}
