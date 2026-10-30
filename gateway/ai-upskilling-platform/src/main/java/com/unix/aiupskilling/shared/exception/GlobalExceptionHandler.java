package com.unix.aiupskilling.shared.exception;

import com.unix.aiupskilling.authentication.dto.response.ErrorData;
import com.unix.aiupskilling.authentication.dto.response.FieldErrorDto;
import com.unix.aiupskilling.authentication.exception.*;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of("NOT_FOUND")));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleValidationException(MethodArgumentNotValidException ex) {
        List<FieldErrorDto> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(f -> new FieldErrorDto(f.getField(), f.getDefaultMessage()))
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Validation failed", ErrorData.of("VALIDATION_ERROR", fieldErrors)));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleNotReadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Malformed request payload", ErrorData.of("VALIDATION_ERROR")));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of("BAD_REQUEST")));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleInvalidCredentials(InvalidCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode())));
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleInvalidRefreshToken(InvalidRefreshTokenException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode())));
    }

    @ExceptionHandler(InvalidLoginCodeException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleInvalidLoginCode(InvalidLoginCodeException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode())));
    }

    @ExceptionHandler(AccountNotEligibleException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleAccountNotEligible(AccountNotEligibleException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode())));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of("FORBIDDEN")));
    }

    @ExceptionHandler(VerificationTokenException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleVerificationTokenException(VerificationTokenException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode())));
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleRateLimit(RateLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode())));
    }

    @ExceptionHandler(OAuthLoginException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleOAuthLoginException(OAuthLoginException ex) {
        HttpStatus status = switch (ex.getCode()) {
            case "OAUTH_ACCESS_DENIED", "OAUTH_ACCOUNT_DISABLED" -> HttpStatus.FORBIDDEN;
            case "OAUTH_ACCOUNT_EXISTS", "OAUTH_ALREADY_LINKED" -> HttpStatus.CONFLICT;
            case "OAUTH_PROVIDER_ERROR" -> HttpStatus.BAD_GATEWAY;
            default -> HttpStatus.BAD_REQUEST;
        };
        return ResponseEntity.status(status)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode())));
    }

    @ExceptionHandler(UsernameAlreadyTakenException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleUsernameAlreadyTaken(UsernameAlreadyTakenException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode())));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleValidationException(ValidationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode(), ex.getFieldErrors())));
    }

    @ExceptionHandler(com.unix.aiupskilling.mentor.exception.MentorKeyAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> handleMentorKeyAlreadyExists(com.unix.aiupskilling.mentor.exception.MentorKeyAlreadyExistsException ex) {
        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("code", ex.getCode());
        data.put("existingKey", ex.getExistingKey());
        data.put("createdAt", ex.getCreatedAt());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.<java.util.Map<String, Object>>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .data(data)
                        .build());
    }

    @ExceptionHandler(com.unix.aiupskilling.mentor.exception.InvalidMentorKeyException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleInvalidMentorKey(com.unix.aiupskilling.mentor.exception.InvalidMentorKeyException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode())));
    }

    @ExceptionHandler(com.unix.aiupskilling.mentor.exception.StudentAlreadyLinkedException.class)
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> handleStudentAlreadyLinked(com.unix.aiupskilling.mentor.exception.StudentAlreadyLinkedException ex) {
        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("code", ex.getCode());
        data.put("mentorName", ex.getMentorName());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.<java.util.Map<String, Object>>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .data(data)
                        .build());
    }

    @ExceptionHandler(com.unix.aiupskilling.mentor.exception.InvalidSortException.class)
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> handleInvalidSort(com.unix.aiupskilling.mentor.exception.InvalidSortException ex) {
        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("code", ex.getCode());
        data.put("allowed", ex.getAllowed());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<java.util.Map<String, Object>>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .data(data)
                        .build());
    }

    @ExceptionHandler(com.unix.aiupskilling.mentor.exception.InvalidProgressBandException.class)
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> handleInvalidProgressBand(com.unix.aiupskilling.mentor.exception.InvalidProgressBandException ex) {
        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("code", ex.getCode());
        data.put("allowed", ex.getAllowed());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<java.util.Map<String, Object>>builder()
                        .success(false)
                        .message(ex.getMessage())
                        .data(data)
                        .build());
    }

    @ExceptionHandler(com.unix.aiupskilling.mentor.exception.InvalidDateRangeException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleInvalidDateRange(com.unix.aiupskilling.mentor.exception.InvalidDateRangeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode())));
    }

    @ExceptionHandler(com.unix.aiupskilling.mentor.exception.StudentNotFoundException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleStudentNotFound(com.unix.aiupskilling.mentor.exception.StudentNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode())));
    }

    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleEmailAlreadyRegistered(EmailAlreadyRegisteredException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage(), ErrorData.of(ex.getCode())));
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleResponseStatusException(org.springframework.web.server.ResponseStatusException ex) {
        String reason = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return ResponseEntity.status(ex.getStatusCode())
                .body(ApiResponse.error(reason, ErrorData.of(ex.getStatusCode().toString())));
    }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleMethodArgumentTypeMismatch(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
        String msg = String.format("Invalid parameter '%s': %s", ex.getName(), ex.getValue());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(msg, ErrorData.of("INVALID_PARAMETER")));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<ErrorData>> handleGeneralException(Exception ex) {
        String correlationId = UUID.randomUUID().toString();
        log.error("Unhandled server error [correlationId={}]: {}", correlationId, ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred. Reference: " + correlationId, ErrorData.of("INTERNAL_ERROR")));
    }
}
