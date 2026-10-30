package com.unix.aiupskilling.authentication.exception;

import lombok.Getter;

@Getter
public class UsernameAlreadyTakenException extends RuntimeException {

    private final String code;

    public UsernameAlreadyTakenException(String message) {
        super(message);
        this.code = "USERNAME_TAKEN";
    }

    public UsernameAlreadyTakenException(String message, String code) {
        super(message);
        this.code = code;
    }
}

