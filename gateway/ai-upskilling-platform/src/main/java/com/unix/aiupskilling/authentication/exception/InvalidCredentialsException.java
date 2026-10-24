package com.unix.aiupskilling.authentication.exception;

import lombok.Getter;

@Getter
public class InvalidCredentialsException extends RuntimeException {

    private final String code;

    public InvalidCredentialsException(String message) {
        super(message);
        this.code = "INVALID_CREDENTIALS";
    }

    public InvalidCredentialsException(String message, String code) {
        super(message);
        this.code = code;
    }
}
