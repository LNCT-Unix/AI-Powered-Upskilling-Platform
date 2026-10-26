package com.unix.aiupskilling.authentication;

import com.unix.aiupskilling.authentication.dto.request.ForgotPasswordRequest;
import com.unix.aiupskilling.authentication.dto.request.ResetPasswordRequest;
import com.unix.aiupskilling.authentication.dto.request.VerifyResetOtpRequest;
import com.unix.aiupskilling.authentication.dto.response.VerifyResetOtpResponse;
import com.unix.aiupskilling.authentication.event.PasswordResetOtpEvent;
import com.unix.aiupskilling.authentication.exception.RateLimitExceededException;
import com.unix.aiupskilling.authentication.exception.VerificationTokenException;
import com.unix.aiupskilling.authentication.model.entity.PasswordResetToken;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.repository.PasswordResetTokenRepository;
import com.unix.aiupskilling.authentication.service.AuthTokenService;
import com.unix.aiupskilling.authentication.service.PasswordResetRateLimiter;
import com.unix.aiupskilling.authentication.service.impl.PasswordResetServiceImpl;
import com.unix.aiupskilling.authentication.util.TokenHashUtil;
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
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private AuthTokenService authTokenService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PasswordResetRateLimiter passwordResetRateLimiter;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private PasswordResetServiceImpl passwordResetService;

    private User testUser;

    @BeforeEach
    void setUp() {
        passwordResetService = new PasswordResetServiceImpl(
                userRepository,
                passwordResetTokenRepository,
                authTokenService,
                passwordEncoder,
                passwordResetRateLimiter,
                eventPublisher
        );

        testUser = User.builder()
                .id(101L)
                .email("learner@example.com")
                .fullName("Learner One")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .passwordHash("{bcrypt}$2a$10$oldHashValueHere")
                .emailVerified(true)
                .build();
    }

    @Test
    @DisplayName("forgotPassword: User exists -> generates 6-digit OTP, stores hash, dispatches event")
    void testForgotPasswordSuccess() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("learner@example.com");
        when(userRepository.findByEmailIgnoreCase("learner@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findTopByUserIdOrderByCreatedAtDesc(101L)).thenReturn(Optional.empty());

        passwordResetService.forgotPassword(request, "192.168.1.1");

        verify(passwordResetRateLimiter).checkLimit("192.168.1.1", "learner@example.com");
        verify(passwordResetRateLimiter).recordRequest("192.168.1.1", "learner@example.com");
        verify(passwordResetTokenRepository).deleteAllByUserId(101L);

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(tokenCaptor.capture());

        PasswordResetToken savedToken = tokenCaptor.getValue();
        assertThat(savedToken.getUserId()).isEqualTo(101L);
        assertThat(savedToken.getOtpHash()).isNotBlank();
        assertThat(savedToken.getFailedAttempts()).isZero();
        assertThat(savedToken.getOtpExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(9));

        ArgumentCaptor<PasswordResetOtpEvent> eventCaptor = ArgumentCaptor.forClass(PasswordResetOtpEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        PasswordResetOtpEvent event = eventCaptor.getValue();
        assertThat(event.email()).isEqualTo("learner@example.com");
        assertThat(event.otp()).matches("^[0-9]{6}$");
        assertThat(TokenHashUtil.sha256(event.otp())).isEqualTo(savedToken.getOtpHash());
    }

    @Test
    @DisplayName("forgotPassword: Non-existent email -> generic response, no token created (user enumeration prevented)")
    void testForgotPasswordNonExistentUser() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("nonexistent@example.com");
        when(userRepository.findByEmailIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());

        passwordResetService.forgotPassword(request, "192.168.1.1");

        verify(passwordResetTokenRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("forgotPassword: 60-second cooldown active -> skips new OTP generation")
    void testForgotPasswordCooldownActive() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("learner@example.com");
        when(userRepository.findByEmailIgnoreCase("learner@example.com")).thenReturn(Optional.of(testUser));

        PasswordResetToken recentToken = PasswordResetToken.builder()
                .id(1L)
                .userId(101L)
                .createdAt(LocalDateTime.now().minusSeconds(20))
                .build();
        when(passwordResetTokenRepository.findTopByUserIdOrderByCreatedAtDesc(101L)).thenReturn(Optional.of(recentToken));

        passwordResetService.forgotPassword(request, "192.168.1.1");

        verify(passwordResetTokenRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    @DisplayName("forgotPassword: Rate limit exceeded -> throws RateLimitExceededException")
    void testForgotPasswordRateLimitExceeded() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("learner@example.com");
        doThrow(new RateLimitExceededException("Too many requests", "RATE_LIMITED"))
                .when(passwordResetRateLimiter).checkLimit("192.168.1.1", "learner@example.com");

        assertThatThrownBy(() -> passwordResetService.forgotPassword(request, "192.168.1.1"))
                .isInstanceOf(RateLimitExceededException.class);

        verify(userRepository, never()).findByEmailIgnoreCase(any());
    }

    @Test
    @DisplayName("verifyResetOtp: Correct OTP -> returns 32-byte resetToken, clears otpHash, sets expiry")
    void testVerifyResetOtpSuccess() {
        String rawOtp = "482910";
        PasswordResetToken token = PasswordResetToken.builder()
                .id(10L)
                .userId(101L)
                .otpHash(TokenHashUtil.sha256(rawOtp))
                .failedAttempts(0)
                .createdAt(LocalDateTime.now().minusMinutes(1))
                .otpExpiresAt(LocalDateTime.now().plusMinutes(9))
                .build();

        when(userRepository.findByEmailIgnoreCase("learner@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findTopByUserIdOrderByCreatedAtDesc(101L)).thenReturn(Optional.of(token));

        VerifyResetOtpRequest request = new VerifyResetOtpRequest("learner@example.com", rawOtp);
        VerifyResetOtpResponse response = passwordResetService.verifyResetOtp(request);

        assertThat(response.getResetToken()).isNotBlank();
        assertThat(token.getOtpHash()).isNull(); // OTP consumed
        assertThat(token.getResetTokenHash()).isEqualTo(TokenHashUtil.sha256(response.getResetToken()));
        assertThat(token.getResetTokenExpiresAt()).isAfter(LocalDateTime.now().plusMinutes(9));
        verify(passwordResetTokenRepository).save(token);
    }

    @Test
    @DisplayName("verifyResetOtp: Wrong OTP -> increments failedAttempts and informs remaining attempts")
    void testVerifyResetOtpWrongCode() {
        String correctOtp = "123456";
        PasswordResetToken token = PasswordResetToken.builder()
                .id(10L)
                .userId(101L)
                .otpHash(TokenHashUtil.sha256(correctOtp))
                .failedAttempts(1)
                .createdAt(LocalDateTime.now().minusMinutes(1))
                .otpExpiresAt(LocalDateTime.now().plusMinutes(9))
                .build();

        when(userRepository.findByEmailIgnoreCase("learner@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findTopByUserIdOrderByCreatedAtDesc(101L)).thenReturn(Optional.of(token));

        VerifyResetOtpRequest request = new VerifyResetOtpRequest("learner@example.com", "999999");

        assertThatThrownBy(() -> passwordResetService.verifyResetOtp(request))
                .isInstanceOf(VerificationTokenException.class)
                .hasMessageContaining("3 attempt(s) remaining");

        assertThat(token.getFailedAttempts()).isEqualTo(2);
        verify(passwordResetTokenRepository).save(token);
    }

    @Test
    @DisplayName("verifyResetOtp: 5th wrong attempt -> deletes token from DB, invalidates session")
    void testVerifyResetOtpMaxAttemptsLimit() {
        String correctOtp = "123456";
        PasswordResetToken token = PasswordResetToken.builder()
                .id(10L)
                .userId(101L)
                .otpHash(TokenHashUtil.sha256(correctOtp))
                .failedAttempts(4) // 4 previous failures
                .createdAt(LocalDateTime.now().minusMinutes(2))
                .otpExpiresAt(LocalDateTime.now().plusMinutes(8))
                .build();

        when(userRepository.findByEmailIgnoreCase("learner@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findTopByUserIdOrderByCreatedAtDesc(101L)).thenReturn(Optional.of(token));

        VerifyResetOtpRequest request = new VerifyResetOtpRequest("learner@example.com", "000000");

        assertThatThrownBy(() -> passwordResetService.verifyResetOtp(request))
                .isInstanceOf(VerificationTokenException.class)
                .matches(e -> ((VerificationTokenException) e).getCode().equals("MAX_ATTEMPTS_EXCEEDED"));

        verify(passwordResetTokenRepository).delete(token);
    }

    @Test
    @DisplayName("verifyResetOtp: Expired OTP (>10 mins) -> rejects and cleans up token")
    void testVerifyResetOtpExpired() {
        PasswordResetToken token = PasswordResetToken.builder()
                .id(10L)
                .userId(101L)
                .otpHash(TokenHashUtil.sha256("123456"))
                .failedAttempts(0)
                .createdAt(LocalDateTime.now().minusMinutes(15))
                .otpExpiresAt(LocalDateTime.now().minusMinutes(5)) // Expired
                .build();

        when(userRepository.findByEmailIgnoreCase("learner@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findTopByUserIdOrderByCreatedAtDesc(101L)).thenReturn(Optional.of(token));

        VerifyResetOtpRequest request = new VerifyResetOtpRequest("learner@example.com", "123456");

        assertThatThrownBy(() -> passwordResetService.verifyResetOtp(request))
                .isInstanceOf(VerificationTokenException.class)
                .matches(e -> ((VerificationTokenException) e).getCode().equals("RESET_CODE_EXPIRED"));

        verify(passwordResetTokenRepository).delete(token);
    }

    @Test
    @DisplayName("verifyResetOtp: Reusing already verified OTP -> rejects immediately")
    void testVerifyResetOtpReusePrevention() {
        PasswordResetToken token = PasswordResetToken.builder()
                .id(10L)
                .userId(101L)
                .otpHash(null) // Already consumed during previous verify
                .resetTokenHash("some-existing-reset-token-hash")
                .failedAttempts(0)
                .createdAt(LocalDateTime.now().minusMinutes(2))
                .otpExpiresAt(LocalDateTime.now().plusMinutes(8))
                .build();

        when(userRepository.findByEmailIgnoreCase("learner@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findTopByUserIdOrderByCreatedAtDesc(101L)).thenReturn(Optional.of(token));

        VerifyResetOtpRequest request = new VerifyResetOtpRequest("learner@example.com", "123456");

        assertThatThrownBy(() -> passwordResetService.verifyResetOtp(request))
                .isInstanceOf(VerificationTokenException.class)
                .matches(e -> ((VerificationTokenException) e).getCode().equals("INVALID_RESET_CODE"));
    }

    @Test
    @DisplayName("resetPassword: Valid reset token -> updates password, marks consumed, revokes all sessions")
    void testResetPasswordSuccess() {
        String rawResetToken = "raw-crypto-reset-token-sample";
        String tokenHash = TokenHashUtil.sha256(rawResetToken);

        PasswordResetToken token = PasswordResetToken.builder()
                .id(20L)
                .userId(101L)
                .resetTokenHash(tokenHash)
                .createdAt(LocalDateTime.now().minusMinutes(2))
                .resetTokenExpiresAt(LocalDateTime.now().plusMinutes(8))
                .consumedAt(null)
                .build();

        when(userRepository.findByEmailIgnoreCase("learner@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findByResetTokenHash(tokenHash)).thenReturn(Optional.of(token));
        when(passwordEncoder.encode("NewStrongPassword123!")).thenReturn("{bcrypt}$2a$10$newlyEncodedPasswordHash");

        ResetPasswordRequest request = new ResetPasswordRequest(
                "learner@example.com",
                rawResetToken,
                "NewStrongPassword123!"
        );

        passwordResetService.resetPassword(request);

        assertThat(testUser.getPasswordHash()).isEqualTo("{bcrypt}$2a$10$newlyEncodedPasswordHash");
        verify(userRepository).save(testUser);

        assertThat(token.getConsumedAt()).isNotNull();
        verify(passwordResetTokenRepository).save(token);

        // Security check: Verify all sessions revoked
        verify(authTokenService).revokeAllFor(101L);
    }

    @Test
    @DisplayName("resetPassword: Token already used -> rejects with RESET_TOKEN_ALREADY_USED")
    void testResetPasswordTokenAlreadyUsed() {
        String rawResetToken = "used-token";
        String tokenHash = TokenHashUtil.sha256(rawResetToken);

        PasswordResetToken token = PasswordResetToken.builder()
                .id(20L)
                .userId(101L)
                .resetTokenHash(tokenHash)
                .createdAt(LocalDateTime.now().minusMinutes(5))
                .resetTokenExpiresAt(LocalDateTime.now().plusMinutes(5))
                .consumedAt(LocalDateTime.now().minusMinutes(1)) // Already consumed
                .build();

        when(userRepository.findByEmailIgnoreCase("learner@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findByResetTokenHash(tokenHash)).thenReturn(Optional.of(token));

        ResetPasswordRequest request = new ResetPasswordRequest(
                "learner@example.com",
                rawResetToken,
                "NewStrongPassword123!"
        );

        assertThatThrownBy(() -> passwordResetService.resetPassword(request))
                .isInstanceOf(VerificationTokenException.class)
                .matches(e -> ((VerificationTokenException) e).getCode().equals("RESET_TOKEN_ALREADY_USED"));

        verify(authTokenService, never()).revokeAllFor(any());
    }

    @Test
    @DisplayName("resetPassword: Token expired -> rejects with RESET_TOKEN_EXPIRED and deletes token")
    void testResetPasswordTokenExpired() {
        String rawResetToken = "expired-token";
        String tokenHash = TokenHashUtil.sha256(rawResetToken);

        PasswordResetToken token = PasswordResetToken.builder()
                .id(20L)
                .userId(101L)
                .resetTokenHash(tokenHash)
                .createdAt(LocalDateTime.now().minusMinutes(20))
                .resetTokenExpiresAt(LocalDateTime.now().minusMinutes(10)) // Expired
                .consumedAt(null)
                .build();

        when(userRepository.findByEmailIgnoreCase("learner@example.com")).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findByResetTokenHash(tokenHash)).thenReturn(Optional.of(token));

        ResetPasswordRequest request = new ResetPasswordRequest(
                "learner@example.com",
                rawResetToken,
                "NewStrongPassword123!"
        );

        assertThatThrownBy(() -> passwordResetService.resetPassword(request))
                .isInstanceOf(VerificationTokenException.class)
                .matches(e -> ((VerificationTokenException) e).getCode().equals("RESET_TOKEN_EXPIRED"));

        verify(passwordResetTokenRepository).delete(token);
        verify(authTokenService, never()).revokeAllFor(any());
    }
}
