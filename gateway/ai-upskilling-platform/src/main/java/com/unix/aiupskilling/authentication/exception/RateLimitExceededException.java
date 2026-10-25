package com.unix.aiupskilling.authentication.exception;

import lombok.Getter;

@Getter
public class RateLimitExceededException extends RuntimeException {

    private final String code;

    public RateLimitExceededException(String message) {
        super(message);
        this.code = "RATE_LIMITED";
    }

    public RateLimitExceededException(String message, String code) {
        super(message);
        this.code = code;
    }
}
