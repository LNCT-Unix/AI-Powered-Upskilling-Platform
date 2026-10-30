package com.unix.aiupskilling.mentor.exception;

import lombok.Getter;

@Getter
public class StudentNotFoundException extends RuntimeException {

    private final String code;

    public StudentNotFoundException(String message) {
        super(message);
        this.code = "STUDENT_NOT_FOUND";
    }
}
