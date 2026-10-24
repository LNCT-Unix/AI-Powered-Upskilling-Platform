package com.unix.ai_upskilling_platform.authentication.exception;

import lombok.Getter;

@Getter
public class InvalidLoginCodeException extends RuntimeException {

    private final String code;

    public InvalidLoginCodeException(String message) {
        super(message);
        this.code = "LOGIN_CODE_INVALID";
    }

    public InvalidLoginCodeException(String message, String code) {
        super(message);
        this.code = code;
    }
}
