package com.unix.aiupskilling.mentor.exception;

import lombok.Getter;

import java.time.Instant;

@Getter
public class MentorKeyAlreadyExistsException extends RuntimeException {

    private final String code;
    private final String existingKey;
    private final Instant createdAt;

    public MentorKeyAlreadyExistsException(String message, String existingKey, Instant createdAt) {
        super(message);
        this.code = "KEY_ALREADY_EXISTS";
        this.existingKey = existingKey;
        this.createdAt = createdAt;
    }
}

