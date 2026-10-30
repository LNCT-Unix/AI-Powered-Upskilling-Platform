package com.unix.aiupskilling.mentor.exception;

import lombok.Getter;

@Getter
public class InvalidMentorKeyException extends RuntimeException {

    private final String code;

    public InvalidMentorKeyException(String message) {
        super(message);
        this.code = "INVALID_MENTOR_KEY";
    }

    public InvalidMentorKeyException(String message, String code) {
        super(message);
        this.code = code;
    }
}

