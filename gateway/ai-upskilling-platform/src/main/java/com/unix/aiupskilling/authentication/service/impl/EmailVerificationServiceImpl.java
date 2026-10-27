package com.unix.aiupskilling.authentication.service.impl;

import com.unix.aiupskilling.authentication.config.AuthProperties;
import com.unix.aiupskilling.authentication.exception.AccountNotEligibleException;
import com.unix.aiupskilling.authentication.exception.VerificationTokenException;
import com.unix.aiupskilling.authentication.model.entity.EmailVerificationToken;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.repository.EmailVerificationTokenRepository;
import com.unix.aiupskilling.authentication.service.EmailVerificationService;
import com.unix.aiupskilling.authentication.util.EmailNormalizer;
import com.unix.aiupskilling.authentication.util.TokenHashUtil;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationServiceImpl.class);

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final AuthProperties authProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public String issueOtp(User user) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User and user id must not be null");
        }

        // Invalidate or delete older tokens for this user
        tokenRepository.deleteAllByUserId(user.getId());

        // Generate cryptographically secure 6-digit numeric OTP
        int code = 100_000 + secureRandom.nextInt(900_000);
        String otp = String.valueOf(code);

        // Store SHA-256 hash of OTP (never plain text)
        String otpHash = TokenHashUtil.sha256(otp);
        long ttl = authProperties.getVerification().getTtlSeconds();
        LocalDateTime now = LocalDateTime.now();

        EmailVerificationToken token = EmailVerificationToken.builder()
                .userId(user.getId())
                .tokenHash(otpHash)
                .failedAttempts(0)
                .createdAt(now)
                .expiresAt(now.plusSeconds(ttl))
                .build();

        tokenRepository.save(token);
        log.info("Email verification OTP generated for user id: {}", user.getId());
        return otp;
    }

    @Override
    @Transactional
    public void verifyOtp(String email, String otp) {
        if (email == null || email.isBlank() || otp == null || otp.isBlank()) {
            throw new VerificationTokenException("Email and verification code are required", "INVALID_VERIFICATION_CODE");
        }

        String normalizedEmail = EmailNormalizer.normalize(email);
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOpt.isEmpty()) {
            throw new VerificationTokenException("Invalid or expired verification code", "INVALID_VERIFICATION_CODE");
        }

        User user = userOpt.get();
        if (user.getStatus() == AccountStatus.DISABLED) {
            throw new AccountNotEligibleException("Account is disabled", "ACCOUNT_DISABLED");
        }

        Optional<EmailVerificationToken> tokenOpt =
                tokenRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId());

        if (tokenOpt.isEmpty()) {
            throw new VerificationTokenException("Invalid or expired verification code", "INVALID_VERIFICATION_CODE");
        }

        EmailVerificationToken token = tokenOpt.get();

        if (token.isConsumed()) {
            throw new VerificationTokenException("Verification code has already been used", "VERIFICATION_CODE_USED");
        }

        if (token.isOtpExpired()) {
            tokenRepository.delete(token);
            throw new VerificationTokenException("Verification code has expired. Please request a new one.", "VERIFICATION_CODE_EXPIRED");
        }

        if (token.hasExceededMaxAttempts()) {
            tokenRepository.delete(token);
            throw new VerificationTokenException("Too many invalid attempts. Verification code has been invalidated.", "MAX_ATTEMPTS_EXCEEDED");
        }

        // Constant-time hash comparison
        String providedOtpHash = TokenHashUtil.sha256(otp.trim());
        boolean matches = MessageDigest.isEqual(
                token.getOtpHash().getBytes(StandardCharsets.UTF_8),
                providedOtpHash.getBytes(StandardCharsets.UTF_8)
        );

        if (!matches) {
            int attempts = token.getFailedAttempts() + 1;
            token.setFailedAttempts(attempts);

            if (token.hasExceededMaxAttempts()) {
                tokenRepository.delete(token);
                throw new VerificationTokenException("Too many invalid attempts. Verification code has been invalidated.", "MAX_ATTEMPTS_EXCEEDED");
            }

            tokenRepository.save(token);
            int remaining = EmailVerificationToken.MAX_FAILED_ATTEMPTS - attempts;
            throw new VerificationTokenException(
                    "Invalid verification code. " + remaining + " attempt(s) remaining.",
                    "INVALID_VERIFICATION_CODE"
            );
        }

        // Mark consumed
        token.setConsumedAt(LocalDateTime.now());
        tokenRepository.save(token);

        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Email verification successful for user id: {}", user.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canResend(User user) {
        if (user == null || user.getId() == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();

        // 1. Check cooldown (e.g. 60 seconds)
        Optional<EmailVerificationToken> latestOpt = tokenRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId());
        if (latestOpt.isPresent()) {
            int cooldownSeconds = authProperties.getVerification().getCooldownSeconds();
            if (latestOpt.get().getCreatedAt().plusSeconds(cooldownSeconds).isAfter(now)) {
                return false;
            }
        }

        // 2. Check hourly cap (e.g. max 5 per hour)
        int maxPerHour = authProperties.getVerification().getMaxPerHour();
        long countRecent = tokenRepository.countByUserIdAndCreatedAtAfter(user.getId(), now.minusHours(1));
        return countRecent < maxPerHour;
    }

    @Override
    @Transactional
    public void invalidateAllForUser(Long userId) {
        if (userId != null) {
            tokenRepository.invalidateAllForUser(userId, LocalDateTime.now());
        }
    }
}
