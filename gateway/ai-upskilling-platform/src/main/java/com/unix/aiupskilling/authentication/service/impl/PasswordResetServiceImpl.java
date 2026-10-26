package com.unix.aiupskilling.authentication.service.impl;

import com.unix.aiupskilling.authentication.dto.request.ForgotPasswordRequest;
import com.unix.aiupskilling.authentication.dto.request.ResetPasswordRequest;
import com.unix.aiupskilling.authentication.dto.request.VerifyResetOtpRequest;
import com.unix.aiupskilling.authentication.dto.response.VerifyResetOtpResponse;
import com.unix.aiupskilling.authentication.event.PasswordResetOtpEvent;
import com.unix.aiupskilling.authentication.exception.AccountNotEligibleException;
import com.unix.aiupskilling.authentication.exception.VerificationTokenException;
import com.unix.aiupskilling.authentication.model.entity.PasswordResetToken;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.repository.PasswordResetTokenRepository;
import com.unix.aiupskilling.authentication.service.AuthTokenService;
import com.unix.aiupskilling.authentication.service.PasswordResetRateLimiter;
import com.unix.aiupskilling.authentication.service.PasswordResetService;
import com.unix.aiupskilling.authentication.util.EmailNormalizer;
import com.unix.aiupskilling.authentication.util.TokenHashUtil;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AuthTokenService authTokenService;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetRateLimiter passwordResetRateLimiter;
    private final ApplicationEventPublisher eventPublisher;

    private final SecureRandom secureRandom = new SecureRandom();

    private static final int COOLDOWN_SECONDS = 60;
    private static final int OTP_VALIDITY_MINUTES = 10;
    private static final int RESET_TOKEN_VALIDITY_MINUTES = 10;

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request, String clientIp) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());

        // Enforce rate limiting: 3 requests / 15 minutes per email and IP
        passwordResetRateLimiter.checkLimit(clientIp, normalizedEmail);
        passwordResetRateLimiter.recordRequest(clientIp, normalizedEmail);

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // Allow password reset only for non-disabled users
            if (user.getStatus() != AccountStatus.DISABLED) {
                // Check 60-second cooldown
                Optional<PasswordResetToken> latestTokenOpt =
                        passwordResetTokenRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId());

                if (latestTokenOpt.isPresent()
                        && latestTokenOpt.get().getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(COOLDOWN_SECONDS))) {
                    log.info("Password reset request received within cooldown period for account. Skipping new OTP generation.");
                    return;
                }

                // Invalidate any older tokens for this user
                passwordResetTokenRepository.deleteAllByUserId(user.getId());

                // Generate cryptographically secure 6-digit numeric OTP
                int code = 100_000 + secureRandom.nextInt(900_000);
                String otp = String.valueOf(code);

                // Store SHA-256 hash of OTP (never plain text)
                String otpHash = TokenHashUtil.sha256(otp);
                LocalDateTime now = LocalDateTime.now();

                PasswordResetToken token = PasswordResetToken.builder()
                        .userId(user.getId())
                        .otpHash(otpHash)
                        .failedAttempts(0)
                        .createdAt(now)
                        .otpExpiresAt(now.plusMinutes(OTP_VALIDITY_MINUTES))
                        .build();

                passwordResetTokenRepository.save(token);

                // Dispatch email event asynchronously without logging OTP
                eventPublisher.publishEvent(new PasswordResetOtpEvent(user.getEmail(), user.getFullName(), otp));
                log.info("Password reset OTP generated and dispatched for user id: {}", user.getId());
            } else {
                log.warn("Password reset requested for disabled user account id: {}", user.getId());
            }
        } else {
            log.info("Password reset requested for non-existent email.");
        }
    }

    @Override
    @Transactional
    public VerifyResetOtpResponse verifyResetOtp(VerifyResetOtpRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (userOpt.isEmpty()) {
            throw new VerificationTokenException("Invalid or expired reset code", "INVALID_RESET_CODE");
        }

        User user = userOpt.get();
        Optional<PasswordResetToken> tokenOpt =
                passwordResetTokenRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId());

        if (tokenOpt.isEmpty()) {
            throw new VerificationTokenException("Invalid or expired reset code", "INVALID_RESET_CODE");
        }

        PasswordResetToken token = tokenOpt.get();

        // Check if token was already consumed or OTP already used
        if (token.isConsumed() || token.getOtpHash() == null) {
            throw new VerificationTokenException("Invalid or expired reset code", "INVALID_RESET_CODE");
        }

        // Check OTP expiry (10 minutes)
        if (token.isOtpExpired()) {
            passwordResetTokenRepository.delete(token);
            throw new VerificationTokenException("Reset code has expired. Please request a new one.", "RESET_CODE_EXPIRED");
        }

        // Check if maximum failed attempts exceeded
        if (token.hasExceededMaxAttempts()) {
            passwordResetTokenRepository.delete(token);
            throw new VerificationTokenException("Too many invalid attempts. Reset code has been invalidated.", "MAX_ATTEMPTS_EXCEEDED");
        }

        // Hash provided OTP for comparison
        String providedOtpHash = TokenHashUtil.sha256(request.getOtp().trim());

        // Constant-time hash comparison against timing attacks
        boolean matches = MessageDigest.isEqual(
                token.getOtpHash().getBytes(StandardCharsets.UTF_8),
                providedOtpHash.getBytes(StandardCharsets.UTF_8)
        );

        if (!matches) {
            int attempts = token.getFailedAttempts() + 1;
            token.setFailedAttempts(attempts);

            if (token.hasExceededMaxAttempts()) {
                passwordResetTokenRepository.delete(token);
                throw new VerificationTokenException("Too many invalid attempts. Reset code has been invalidated.", "MAX_ATTEMPTS_EXCEEDED");
            }

            passwordResetTokenRepository.save(token);
            int remaining = PasswordResetToken.MAX_FAILED_ATTEMPTS - attempts;
            throw new VerificationTokenException(
                    "Invalid reset code. " + remaining + " attempt(s) remaining.",
                    "INVALID_RESET_CODE"
            );
        }

        // OTP is correct - generate a cryptographically secure 32-byte URL-safe reset token
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawResetToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        String resetTokenHash = TokenHashUtil.sha256(rawResetToken);

        // Consume OTP and activate short-lived reset token (10 mins)
        token.setOtpHash(null);
        token.setResetTokenHash(resetTokenHash);
        token.setFailedAttempts(0);
        token.setResetTokenExpiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_VALIDITY_MINUTES));

        passwordResetTokenRepository.save(token);

        log.info("Password reset OTP successfully verified for user id: {}", user.getId());
        return new VerifyResetOtpResponse(rawResetToken);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (userOpt.isEmpty()) {
            throw new VerificationTokenException("Invalid or expired reset token", "INVALID_RESET_TOKEN");
        }

        User user = userOpt.get();
        if (user.getStatus() == AccountStatus.DISABLED) {
            throw new AccountNotEligibleException("Account is disabled", "ACCOUNT_DISABLED");
        }

        // Look up token by resetTokenHash
        String providedTokenHash = TokenHashUtil.sha256(request.getResetToken().trim());
        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByResetTokenHash(providedTokenHash);

        if (tokenOpt.isEmpty()) {
            throw new VerificationTokenException("Invalid or expired reset token", "INVALID_RESET_TOKEN");
        }

        PasswordResetToken token = tokenOpt.get();

        // Verify token belongs to this user
        if (!token.getUserId().equals(user.getId())) {
            throw new VerificationTokenException("Invalid or expired reset token", "INVALID_RESET_TOKEN");
        }

        // Check if token has already been consumed
        if (token.isConsumed()) {
            throw new VerificationTokenException("Reset token has already been used", "RESET_TOKEN_ALREADY_USED");
        }

        // Check reset token expiry (10 minutes)
        if (token.isResetTokenExpired()) {
            passwordResetTokenRepository.delete(token);
            throw new VerificationTokenException("Reset token has expired. Please request a new password reset.", "RESET_TOKEN_EXPIRED");
        }

        // Encode new password and persist
        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPasswordHash(encodedPassword);
        userRepository.save(user);

        // Mark reset token as consumed (one-time use)
        token.setConsumedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(token);

        // Revoke all active refresh tokens and sessions for this user across all devices
        authTokenService.revokeAllFor(user.getId());

        log.info("Password reset successful and all sessions revoked for user id: {}", user.getId());
    }
}
