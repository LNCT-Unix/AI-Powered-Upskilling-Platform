package com.unix.aiupskilling.shared.exception;

import com.unix.aiupskilling.authentication.dto.response.FieldErrorDto;
import lombok.Getter;

import java.util.List;

@Getter
public class ValidationException extends RuntimeException {

    private final String code;
    private final List<FieldErrorDto> fieldErrors;

    public ValidationException(String message, List<FieldErrorDto> fieldErrors) {
        super(message);
        this.code = "VALIDATION_FAILED";
        this.fieldErrors = fieldErrors != null ? fieldErrors : List.of();
    }

    public ValidationException(String field, String message) {
        super("Validation failed");
        this.code = "VALIDATION_FAILED";
        this.fieldErrors = List.of(new FieldErrorDto(field, message));
    }
}

