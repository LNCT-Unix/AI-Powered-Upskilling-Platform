package com.unix.aiupskilling.authentication.exception;

import lombok.Getter;

@Getter
public class EmailAlreadyRegisteredException extends RuntimeException {

    private final String code;

    public EmailAlreadyRegisteredException(String message) {
        super(message);
        this.code = "EMAIL_ALREADY_REGISTERED";
    }

    public EmailAlreadyRegisteredException(String message, String code) {
        super(message);
        this.code = code;
    }
}
