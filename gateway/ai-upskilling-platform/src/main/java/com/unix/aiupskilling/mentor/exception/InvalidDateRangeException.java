package com.unix.aiupskilling.mentor.exception;

import lombok.Getter;

@Getter
public class InvalidDateRangeException extends RuntimeException {

    private final String code;

    public InvalidDateRangeException(String message) {
        super(message);
        this.code = "INVALID_DATE_RANGE";
    }
}

