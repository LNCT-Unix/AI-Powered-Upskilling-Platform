package com.unix.aiupskilling.mentor.exception;

import lombok.Getter;

import java.util.List;

@Getter
public class InvalidProgressBandException extends RuntimeException {

    private final String code;
    private final List<String> allowed;

    public InvalidProgressBandException(String message, List<String> allowed) {
        super(message);
        this.code = "INVALID_PROGRESS_BAND";
        this.allowed = allowed != null ? allowed : List.of();
    }
}
