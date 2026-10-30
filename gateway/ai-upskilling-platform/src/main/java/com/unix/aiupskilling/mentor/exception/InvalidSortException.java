package com.unix.aiupskilling.mentor.exception;

import lombok.Getter;

import java.util.List;

@Getter
public class InvalidSortException extends RuntimeException {

    private final String code;
    private final List<String> allowed;

    public InvalidSortException(String message, List<String> allowed) {
        super(message);
        this.code = "INVALID_SORT";
        this.allowed = allowed != null ? allowed : List.of();
    }
}
