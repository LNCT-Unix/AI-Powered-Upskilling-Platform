package com.unix.aiupskilling.authentication.service.impl;

import com.unix.aiupskilling.authentication.dto.request.ConfirmEmailRequest;
import com.unix.aiupskilling.authentication.dto.request.LoginRequest;
import com.unix.aiupskilling.authentication.dto.request.RegisterRequest;
import com.unix.aiupskilling.authentication.dto.request.ResendVerificationRequest;
import com.unix.aiupskilling.authentication.dto.response.AuthTokens;
import com.unix.aiupskilling.authentication.dto.response.RegistrationAcceptedResponse;
import com.unix.aiupskilling.authentication.event.EmailVerificationEvent;
import com.unix.aiupskilling.authentication.exception.EmailAlreadyRegisteredException;
import com.unix.aiupskilling.authentication.exception.InvalidCredentialsException;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import com.unix.aiupskilling.authentication.service.*;
import com.unix.aiupskilling.authentication.util.EmailNormalizer;
import com.unix.aiupskilling.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmailAuthServiceImpl implements EmailAuthService {

    private final UserProvisioningService userProvisioningService;
    private final AccountEligibilityService accountEligibilityService;
    private final AuthTokenService authTokenService;
    private final EmailVerificationService emailVerificationService;
    private final RateLimiterService rateLimiterService;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    // A valid precomputed dummy BCrypt hash for timing attack mitigation on invalid/non-password logins
    private static final String DUMMY_HASH = "{bcrypt}$2a$10$7EqJtq98hPqEX7fNZaFWoO.8D/u59/pQcZ8F.Wk8kXh9s6D16Fp7a";

    @Override
    @Transactional
    public RegistrationAcceptedResponse register(RegisterRequest request, String clientIp) {
        rateLimiterService.checkRegisterResendIpLimit(clientIp);

        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());

        Optional<User> existingUserOpt = userProvisioningService.findByEmail(normalizedEmail);

        if (existingUserOpt.isEmpty()) {
            try {
                String encodedPassword = passwordEncoder.encode(request.getPassword());
                String fullName = (request.getFullName() != null) ? request.getFullName().trim() : "";
                User newUser = userProvisioningService.createEmailUser(normalizedEmail, fullName, encodedPassword);

                String otp = emailVerificationService.issueOtp(newUser);
                eventPublisher.publishEvent(new EmailVerificationEvent(newUser.getEmail(), newUser.getFullName(), otp));
            } catch (EmailAlreadyRegisteredException e) {
                // Handled gracefully in case of concurrent insert race
            }
        } else {
            User existing = existingUserOpt.get();
            // If unverified password user and eligible for resend, send replacement OTP silently
            if (existing.getPasswordHash() != null
                    && !existing.isEmailVerified()
                    && existing.getStatus() != AccountStatus.DISABLED) {
                if (emailVerificationService.canResend(existing)) {
                    String otp = emailVerificationService.issueOtp(existing);
                    eventPublisher.publishEvent(new EmailVerificationEvent(existing.getEmail(), existing.getFullName(), otp));
                }
            }
            // For verified or OAuth-only accounts, do not alter account and return generic response
        }

        return new RegistrationAcceptedResponse(normalizedEmail, true);
    }

    @Override
    @Transactional
    public void confirmEmail(ConfirmEmailRequest request) {
        emailVerificationService.verifyOtp(request.getEmail(), request.getOtp());
    }

    @Override
    @Transactional
    public RegistrationAcceptedResponse resendVerification(ResendVerificationRequest request, String clientIp) {
        rateLimiterService.checkRegisterResendIpLimit(clientIp);

        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());
        Optional<User> existingUserOpt = userProvisioningService.findByEmail(normalizedEmail);

        if (existingUserOpt.isPresent()) {
            User user = existingUserOpt.get();
            if (user.getPasswordHash() != null
                    && !user.isEmailVerified()
                    && user.getStatus() != AccountStatus.DISABLED) {
                if (emailVerificationService.canResend(user)) {
                    String otp = emailVerificationService.issueOtp(user);
                    eventPublisher.publishEvent(new EmailVerificationEvent(user.getEmail(), user.getFullName(), otp));
                }
            }
        }

        // Generic response for unknown, verified, OAuth-only, and cooldown cases
        return new RegistrationAcceptedResponse(normalizedEmail, true);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthTokens login(LoginRequest request, ClientPlatform platform, String clientIp) {
        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());
        rateLimiterService.checkLoginRateLimit(clientIp, normalizedEmail);

        Optional<User> userOpt = userProvisioningService.findByEmail(normalizedEmail);

        if (userOpt.isEmpty() || userOpt.get().getPasswordHash() == null) {
            // Timing-safe dummy comparison
            passwordEncoder.matches(request.getPassword(), DUMMY_HASH);
            rateLimiterService.recordFailedLogin(clientIp, normalizedEmail);
            throw new InvalidCredentialsException("Invalid email or password", "INVALID_CREDENTIALS");
        }

        User user = userOpt.get();
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        if (!matches) {
            rateLimiterService.recordFailedLogin(clientIp, normalizedEmail);
            throw new InvalidCredentialsException("Invalid email or password", "INVALID_CREDENTIALS");
        }

        // Reset failed login count on successful password match
        rateLimiterService.resetFailedLogin(clientIp, normalizedEmail);

        // Account eligibility check (discloses disabled/unverified ONLY after valid credentials)
        accountEligibilityService.assertCanLoginWithPassword(user);

        // Delegate token issuance strictly to AuthTokenService
        return authTokenService.issueTokens(user, platform);
    }
}
