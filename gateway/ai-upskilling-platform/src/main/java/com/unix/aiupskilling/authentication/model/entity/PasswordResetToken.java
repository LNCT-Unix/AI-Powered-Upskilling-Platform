package com.unix.aiupskilling.authentication.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens", indexes = {
        @Index(name = "idx_prt_user_id", columnList = "user_id"),
        @Index(name = "idx_prt_otp_hash", columnList = "otp_hash"),
        @Index(name = "idx_prt_reset_token_hash", columnList = "reset_token_hash")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {

    public static final int MAX_FAILED_ATTEMPTS = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "otp_hash", length = 64)
    private String otpHash;

    @Column(name = "reset_token_hash", length = 64)
    private String resetTokenHash;

    @Column(name = "failed_attempts", nullable = false)
    @Builder.Default
    private int failedAttempts = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "otp_expires_at", nullable = false)
    private LocalDateTime otpExpiresAt;

    @Column(name = "reset_token_expires_at")
    private LocalDateTime resetTokenExpiresAt;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public boolean isOtpExpired() {
        return otpExpiresAt != null && otpExpiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isResetTokenExpired() {
        return resetTokenExpiresAt != null && resetTokenExpiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isConsumed() {
        return consumedAt != null;
    }

    public boolean hasExceededMaxAttempts() {
        return failedAttempts >= MAX_FAILED_ATTEMPTS;
    }
}
