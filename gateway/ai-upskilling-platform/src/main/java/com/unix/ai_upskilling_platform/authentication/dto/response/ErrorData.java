package com.unix.ai_upskilling_platform.authentication.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorData {

    private String code;
    private List<FieldErrorDto> fieldErrors;

    public static ErrorData of(String code) {
        return ErrorData.builder().code(code).build();
    }

    public static ErrorData of(String code, List<FieldErrorDto> fieldErrors) {
        return ErrorData.builder().code(code).fieldErrors(fieldErrors).build();
    }
}
