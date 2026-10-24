package com.unix.ai_upskilling_platform.authentication.exception;

import lombok.Getter;
import org.springframework.security.core.AuthenticationException;

@Getter
public class OAuthLoginException extends AuthenticationException {

    private final String code;

    public OAuthLoginException(String code, String message) {
        super(message);
        this.code = code;
    }

    public OAuthLoginException(String code) {
        super(code);
        this.code = code;
    }
}
