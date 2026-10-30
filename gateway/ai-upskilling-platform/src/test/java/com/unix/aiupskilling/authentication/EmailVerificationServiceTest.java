package com.unix.aiupskilling.authentication;

import com.unix.aiupskilling.authentication.config.AuthProperties;
import com.unix.aiupskilling.authentication.exception.AccountNotEligibleException;
import com.unix.aiupskilling.authentication.exception.VerificationTokenException;
import com.unix.aiupskilling.authentication.model.entity.EmailVerificationToken;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.repository.EmailVerificationTokenRepository;
import com.unix.aiupskilling.authentication.service.impl.EmailVerificationServiceImpl;
import com.unix.aiupskilling.authentication.util.TokenHashUtil;
import com.unix.aiupskilling.mentor.repository.MentorProfileRepository;
import com.unix.aiupskilling.user.Role;
import com.unix.aiupskilling.user.User;
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

    @Mock
    private MentorProfileRepository mentorProfileRepository;

    private AuthProperties authProperties;
    private EmailVerificationServiceImpl verificationService;
    private User testUser;

    @BeforeEach
    void setUp() {
        authProperties = new AuthProperties();
        authProperties.getVerification().setTtlSeconds(600);
        authProperties.getVerification().setCooldownSeconds(60);
        authProperties.getVerification().setMaxPerHour(5);

        verificationService = new EmailVerificationServiceImpl(tokenRepository, userRepository, mentorProfileRepository, authProperties);

        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(false)
                .build();
    }

    @Test
    @DisplayName("issueOtp: Generates 6-digit numeric OTP, persists SHA-256 hash, and clears older tokens")
    void testIssueOtp() {
        when(tokenRepository.save(any(EmailVerificationToken.class))).thenAnswer(i -> i.getArgument(0));

        String otp = verificationService.issueOtp(testUser);

        assertThat(otp).isNotBlank();
        assertThat(otp).matches("^[0-9]{6}$");

        verify(tokenRepository).deleteAllByUserId(1L);

        ArgumentCaptor<EmailVerificationToken> captor = ArgumentCaptor.forClass(EmailVerificationToken.class);
        verify(tokenRepository).save(captor.capture());

        EmailVerificationToken saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(1L);
        assertThat(saved.getOtpHash()).isEqualTo(TokenHashUtil.sha256(otp));
        assertThat(saved.getFailedAttempts()).isEqualTo(0);
        assertThat(saved.getExpiresAt()).isAfter(saved.getCreatedAt());
    }

    @Test
    @DisplayName("verifyOtp: Successfully consumes OTP and verifies user")
    void testVerifyOtpSuccess() {
        String rawOtp = "123456";
        String hash = TokenHashUtil.sha256(rawOtp);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(10L)
                .userId(1L)
                .otpHash(hash)
                .failedAttempts(0)
                .createdAt(LocalDateTime.now().minusMinutes(1))
                .expiresAt(LocalDateTime.now().plusMinutes(9))
                .build();

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findTopByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.of(token));

        verificationService.verifyOtp("test@example.com", rawOtp);

        assertThat(testUser.isEmailVerified()).isTrue();
        assertThat(testUser.getEmailVerifiedAt()).isNotNull();
        assertThat(token.isConsumed()).isTrue();
        verify(userRepository).save(testUser);
        verify(tokenRepository).save(token);
    }

    @Test
    @DisplayName("verifyOtp: Rejects unknown user with INVALID_VERIFICATION_CODE")
    void testVerifyOtpUnknownUser() {
        when(userRepository.findByEmailIgnoreCase("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> verificationService.verifyOtp("unknown@example.com", "123456"))
                .isInstanceOf(VerificationTokenException.class)
                .matches(e -> ((VerificationTokenException) e).getCode().equals("INVALID_VERIFICATION_CODE"));
    }

    @Test
    @DisplayName("verifyOtp: Rejects already consumed OTP with VERIFICATION_CODE_USED")
    void testVerifyOtpAlreadyUsed() {
        String rawOtp = "123456";
        String hash = TokenHashUtil.sha256(rawOtp);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(11L)
                .userId(1L)
                .otpHash(hash)
                .createdAt(LocalDateTime.now().minusMinutes(5))
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .consumedAt(LocalDateTime.now().minusMinutes(2))
                .build();

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findTopByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> verificationService.verifyOtp("test@example.com", rawOtp))
                .isInstanceOf(VerificationTokenException.class)
                .matches(e -> ((VerificationTokenException) e).getCode().equals("VERIFICATION_CODE_USED"));
    }

    @Test
    @DisplayName("verifyOtp: Rejects expired OTP with VERIFICATION_CODE_EXPIRED")
    void testVerifyOtpExpired() {
        String rawOtp = "123456";
        String hash = TokenHashUtil.sha256(rawOtp);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(12L)
                .userId(1L)
                .otpHash(hash)
                .createdAt(LocalDateTime.now().minusMinutes(20))
                .expiresAt(LocalDateTime.now().minusMinutes(10))
                .build();

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findTopByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> verificationService.verifyOtp("test@example.com", rawOtp))
                .isInstanceOf(VerificationTokenException.class)
                .matches(e -> ((VerificationTokenException) e).getCode().equals("VERIFICATION_CODE_EXPIRED"));

        verify(tokenRepository).delete(token);
    }

    @Test
    @DisplayName("verifyOtp: Increments failed attempts on mismatch and reports remaining attempts")
    void testVerifyOtpFailedAttemptIncrement() {
        String actualOtp = "123456";
        String wrongOtp = "654321";

        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(14L)
                .userId(1L)
                .otpHash(TokenHashUtil.sha256(actualOtp))
                .failedAttempts(1)
                .createdAt(LocalDateTime.now().minusMinutes(1))
                .expiresAt(LocalDateTime.now().plusMinutes(9))
                .build();

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findTopByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> verificationService.verifyOtp("test@example.com", wrongOtp))
                .isInstanceOf(VerificationTokenException.class)
                .hasMessageContaining("3 attempt(s) remaining")
                .matches(e -> ((VerificationTokenException) e).getCode().equals("INVALID_VERIFICATION_CODE"));

        assertThat(token.getFailedAttempts()).isEqualTo(2);
        verify(tokenRepository).save(token);
    }

    @Test
    @DisplayName("verifyOtp: Exceeding max attempts invalidates code with MAX_ATTEMPTS_EXCEEDED")
    void testVerifyOtpMaxAttemptsExceeded() {
        String actualOtp = "123456";
        String wrongOtp = "999999";

        EmailVerificationToken token = EmailVerificationToken.builder()
                .id(15L)
                .userId(1L)
                .otpHash(TokenHashUtil.sha256(actualOtp))
                .failedAttempts(4)
                .createdAt(LocalDateTime.now().minusMinutes(1))
                .expiresAt(LocalDateTime.now().plusMinutes(9))
                .build();

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findTopByUserIdOrderByCreatedAtDesc(1L)).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> verificationService.verifyOtp("test@example.com", wrongOtp))
                .isInstanceOf(VerificationTokenException.class)
                .matches(e -> ((VerificationTokenException) e).getCode().equals("MAX_ATTEMPTS_EXCEEDED"));

        verify(tokenRepository).delete(token);
    }

    @Test
    @DisplayName("verifyOtp: Rejects disabled user with ACCOUNT_DISABLED")
    void testVerifyOtpDisabledAccount() {
        testUser.setStatus(AccountStatus.DISABLED);

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> verificationService.verifyOtp("test@example.com", "123456"))
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
