package com.unix.aiupskilling.authentication.exception;

import lombok.Getter;

@Getter
public class VerificationTokenException extends RuntimeException {

    private final String code;

    public VerificationTokenException(String message, String code) {
        super(message);
        this.code = code;
    }

    public VerificationTokenException(String message) {
        super(message);
        this.code = "VERIFICATION_TOKEN_INVALID";
    }
}
