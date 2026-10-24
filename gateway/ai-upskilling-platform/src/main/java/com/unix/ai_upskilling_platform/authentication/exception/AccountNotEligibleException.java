package com.unix.ai_upskilling_platform.authentication.exception;

import lombok.Getter;

@Getter
public class AccountNotEligibleException extends RuntimeException {

    private final String code;

    public AccountNotEligibleException(String message, String code) {
        super(message);
        this.code = code;
    }

    public AccountNotEligibleException(String message) {
        super(message);
        this.code = "ACCOUNT_NOT_ELIGIBLE";
    }
}
