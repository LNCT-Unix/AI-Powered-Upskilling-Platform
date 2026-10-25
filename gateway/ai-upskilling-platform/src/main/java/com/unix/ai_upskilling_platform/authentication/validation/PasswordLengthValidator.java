package com.unix.aiupskilling.authentication.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.nio.charset.StandardCharsets;

public class PasswordLengthValidator implements ConstraintValidator<ValidPasswordLength, String> {

    private int min;
    private int max;

    @Override
    public void initialize(ValidPasswordLength constraintAnnotation) {
        this.min = constraintAnnotation.min();
        this.max = constraintAnnotation.max();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }
        int byteLength = value.getBytes(StandardCharsets.UTF_8).length;
        return byteLength >= min && byteLength <= max;
    }
}
