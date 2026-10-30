package com.unix.aiupskilling.mentor.exception;

import lombok.Getter;

@Getter
public class StudentAlreadyLinkedException extends RuntimeException {

    private final String code;
    private final String mentorName;

    public StudentAlreadyLinkedException(String message, String mentorName) {
        super(message);
        this.code = "ALREADY_LINKED";
        this.mentorName = mentorName;
    }
}

