package com.unix.ai_upskilling_platform.authentication.service.impl;

import com.unix.ai_upskilling_platform.authentication.config.AuthProperties;
import com.unix.ai_upskilling_platform.authentication.exception.AccountNotEligibleException;
import com.unix.ai_upskilling_platform.authentication.exception.VerificationTokenException;
import com.unix.ai_upskilling_platform.authentication.model.entity.EmailVerificationToken;
import com.unix.ai_upskilling_platform.authentication.model.enums.AccountStatus;
import com.unix.ai_upskilling_platform.authentication.repository.EmailVerificationTokenRepository;
import com.unix.ai_upskilling_platform.authentication.service.EmailVerificationService;
import com.unix.ai_upskilling_platform.authentication.util.TokenHashUtil;
import com.unix.ai_upskilling_platform.model.entity.User;
import com.unix.ai_upskilling_platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmailVerificationServiceImpl implements EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final AuthProperties authProperties;
    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public String issueToken(User user) {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String tokenHash = TokenHashUtil.sha256(rawToken);

        // Invalidate any existing unconsumed tokens for this user
        tokenRepository.invalidateAllForUser(user.getId(), LocalDateTime.now());

        long ttl = authProperties.getVerification().getTtlSeconds();
        LocalDateTime now = LocalDateTime.now();
        EmailVerificationToken token = EmailVerificationToken.builder()
                .userId(user.getId())
                .tokenHash(tokenHash)
                .createdAt(now)
                .expiresAt(now.plusSeconds(ttl))
                .build();

        tokenRepository.save(token);
        return rawToken;
    }

    @Override
    @Transactional
    public void confirmToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new VerificationTokenException("Invalid verification token", "VERIFICATION_TOKEN_INVALID");
        }

        String tokenHash = TokenHashUtil.sha256(rawToken.trim());
        EmailVerificationToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new VerificationTokenException("Invalid verification token", "VERIFICATION_TOKEN_INVALID"));

        if (token.getConsumedAt() != null) {
            throw new VerificationTokenException("Verification token has already been used", "VERIFICATION_TOKEN_USED");
        }

        if (token.isExpired()) {
            throw new VerificationTokenException("Verification token has expired", "VERIFICATION_TOKEN_EXPIRED");
        }

        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new VerificationTokenException("User not found", "VERIFICATION_TOKEN_INVALID"));

        if (user.getStatus() == AccountStatus.DISABLED) {
            throw new AccountNotEligibleException("Account is disabled", "ACCOUNT_DISABLED");
        }


        int affectedRows = tokenRepository.markConsumedIfUnconsumed(token.getId(), LocalDateTime.now());
        if (affectedRows == 0) {
            throw new VerificationTokenException("Verification token has already been used", "VERIFICATION_TOKEN_USED");
        }

        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        userRepository.save(user);
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
