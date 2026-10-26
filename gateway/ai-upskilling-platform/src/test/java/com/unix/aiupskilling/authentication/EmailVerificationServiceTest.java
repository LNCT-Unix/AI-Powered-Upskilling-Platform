package com.unix.aiupskilling.authentication;

import com.unix.aiupskilling.authentication.config.AuthProperties;
import com.unix.aiupskilling.authentication.exception.AccountNotEligibleException;
import com.unix.aiupskilling.authentication.exception.VerificationTokenException;
import com.unix.aiupskilling.authentication.model.entity.EmailVerificationToken;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.repository.EmailVerificationTokenRepository;
import com.unix.aiupskilling.authentication.service.impl.EmailVerificationServiceImpl;
import com.unix.aiupskilling.authentication.util.TokenHashUtil;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.Role;
import com.unix.aiupskilling.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    private EmailVerificationTokenRepository tokenRepository;

    @Mock
    private UserRepository userRepository;

    private AuthProperties authProperties;
    private EmailVerificationServiceImpl verificationService;
    private User testUser;

    @BeforeEach
    void setUp() {
        authProperties = new AuthProperties();
        authProperties.getVerification().setTtlSeconds(86400);
        authProperties.getVerification().setCooldownSeconds(60);
        authProperties.getVerification().setMaxPerHour(5);

        verificationService = new EmailVerificationServiceImpl(tokenRepository, userRepository, authProperties);

        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(false)
                .build();
    }

    @Test
    @DisplayName("issueToken: Generates URL-safe token, persists SHA-256 hash, and invalidates old tokens")
    void testIssueToken() {
        when(tokenRepository.save(any(EmailVerificationToken.class))).thenAnswer(i -> i.getArgument(0));

        String rawToken = verificationService.issueToken(testUser);

        assertThat(rawToken).isNotBlank();
        assertThat(rawToken).matches("^[A-Za-z0-9_-]+$"); // Base64 URL-safe without padding

        verify(tokenRepository).invalidateAllForUser(eq(1L), any(LocalDateTime.class));

        ArgumentCaptor<EmailVerificationToken> captor = ArgumentCaptor.forClass(EmailVerificationToken.class);
        verify(tokenRepository).save(captor.capture());

        EmailVerificationToken saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(1L);
        assertThat(saved.getTokenHash()).isEqualTo(TokenHashUtil.sha256(rawToken));
        assertThat(saved.getExpiresAt()).isAfter(saved.getCreatedAt());
    }

    @Test
    @DisplayName("confirmToken: Successfully consumes token and verifies user")
    void testConfirmTokenSuccess() {
        String rawToken = "sample-raw-token-123";
        String hash = TokenHashUtil.sha256(rawToken);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(10L)
                .userId(1L)
                .tokenHash(hash)
                .createdAt(LocalDateTime.now().minusMinutes(5))
                .expiresAt(LocalDateTime.now().plusHours(23))
                .build();

        when(tokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(token));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(tokenRepository.markConsumedIfUnconsumed(eq(10L), any(LocalDateTime.class))).thenReturn(1);

        verificationService.confirmToken(rawToken);

        assertThat(testUser.isEmailVerified()).isTrue();
        assertThat(testUser.getEmailVerifiedAt()).isNotNull();
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("confirmToken: Rejects unknown token with VERIFICATION_TOKEN_INVALID")
    void testConfirmTokenInvalid() {
        when(tokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> verificationService.confirmToken("unknown-token"))
                .isInstanceOf(VerificationTokenException.class)
                .matches(e -> ((VerificationTokenException) e).getCode().equals("VERIFICATION_TOKEN_INVALID"));
    }

    @Test
    @DisplayName("confirmToken: Rejects already consumed token with VERIFICATION_TOKEN_USED")
    void testConfirmTokenAlreadyUsed() {
        String rawToken = "used-token";
        String hash = TokenHashUtil.sha256(rawToken);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(11L)
                .userId(1L)
                .tokenHash(hash)
                .createdAt(LocalDateTime.now().minusHours(1))
                .expiresAt(LocalDateTime.now().plusHours(20))
                .consumedAt(LocalDateTime.now().minusMinutes(10))
                .build();

        when(tokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> verificationService.confirmToken(rawToken))
                .isInstanceOf(VerificationTokenException.class)
                .matches(e -> ((VerificationTokenException) e).getCode().equals("VERIFICATION_TOKEN_USED"));
    }

    @Test
    @DisplayName("confirmToken: Rejects expired token with VERIFICATION_TOKEN_EXPIRED")
    void testConfirmTokenExpired() {
        String rawToken = "expired-token";
        String hash = TokenHashUtil.sha256(rawToken);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(12L)
                .userId(1L)
                .tokenHash(hash)
                .createdAt(LocalDateTime.now().minusDays(2))
                .expiresAt(LocalDateTime.now().minusDays(1))
                .build();

        when(tokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> verificationService.confirmToken(rawToken))
                .isInstanceOf(VerificationTokenException.class)
                .matches(e -> ((VerificationTokenException) e).getCode().equals("VERIFICATION_TOKEN_EXPIRED"));
    }

    @Test
    @DisplayName("confirmToken: Rejects disabled user with ACCOUNT_DISABLED")
    void testConfirmTokenDisabledAccount() {
        String rawToken = "disabled-user-token";
        String hash = TokenHashUtil.sha256(rawToken);
        testUser.setStatus(AccountStatus.DISABLED);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(13L)
                .userId(1L)
                .tokenHash(hash)
                .createdAt(LocalDateTime.now().minusMinutes(5))
                .expiresAt(LocalDateTime.now().plusHours(23))
                .build();

        when(tokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(token));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> verificationService.confirmToken(rawToken))

                .isInstanceOf(AccountNotEligibleException.class)
                .matches(e -> ((AccountNotEligibleException) e).getCode().equals("ACCOUNT_DISABLED"));
    }

    @Test
    @DisplayName("canResend: Enforces 60-second cooldown and 5 per hour cap")
    void testCanResend() {
        // 1. Within cooldown period (e.g. created 30s ago)
        EmailVerificationToken recentToken = EmailVerificationToken.builder()
                .id(20L)
                .userId(1L)
                .createdAt(LocalDateTime.now().minusSeconds(30))
                .build();
        when(tokenRepository.findTopByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.of(recentToken));

        boolean canResendInCooldown = verificationService.canResend(testUser);
        assertThat(canResendInCooldown).isFalse();

        // 2. Past cooldown (e.g. created 90s ago), but hourly count is under cap
        EmailVerificationToken olderToken = EmailVerificationToken.builder()
                .id(21L)
                .userId(1L)
                .createdAt(LocalDateTime.now().minusSeconds(90))
                .build();
        when(tokenRepository.findTopByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.of(olderToken));

        when(tokenRepository.countByUserIdAndCreatedAtAfter(eq(1L), any(LocalDateTime.class))).thenReturn(2L);

        boolean canResendAllowed = verificationService.canResend(testUser);
        assertThat(canResendAllowed).isTrue();

        // 3. Past cooldown, but reached hourly limit (5)
        when(tokenRepository.countByUserIdAndCreatedAtAfter(eq(1L), any(LocalDateTime.class))).thenReturn(5L);
        boolean canResendCapReached = verificationService.canResend(testUser);
        assertThat(canResendCapReached).isFalse();
    }
}
