package com.unix.ai_upskilling_platform.authentication.exception;

import lombok.Getter;

@Getter
public class InvalidRefreshTokenException extends RuntimeException {

    private final String code;

    public InvalidRefreshTokenException(String message) {
        super(message);
        this.code = "REFRESH_TOKEN_INVALID";
    }

    public InvalidRefreshTokenException(String message, String code) {
        super(message);
        this.code = code;
    }
}
