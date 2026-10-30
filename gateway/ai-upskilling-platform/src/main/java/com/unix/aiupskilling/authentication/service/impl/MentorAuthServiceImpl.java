package com.unix.aiupskilling.authentication.service.impl;

import com.unix.aiupskilling.authentication.dto.request.MentorRegisterRequest;
import com.unix.aiupskilling.authentication.dto.response.RegistrationAcceptedResponse;
import com.unix.aiupskilling.authentication.event.EmailVerificationEvent;
import com.unix.aiupskilling.authentication.exception.EmailAlreadyRegisteredException;
import com.unix.aiupskilling.authentication.exception.UsernameAlreadyTakenException;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.service.EmailVerificationService;
import com.unix.aiupskilling.authentication.service.MentorAuthService;
import com.unix.aiupskilling.authentication.service.RateLimiterService;
import com.unix.aiupskilling.authentication.service.UserProvisioningService;
import com.unix.aiupskilling.authentication.util.EmailNormalizer;
import com.unix.aiupskilling.shared.exception.ValidationException;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MentorAuthServiceImpl implements MentorAuthService {

    private final UserProvisioningService userProvisioningService;
    private final UserRepository userRepository;
    private final EmailVerificationService emailVerificationService;
    private final RateLimiterService rateLimiterService;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public RegistrationAcceptedResponse register(MentorRegisterRequest request, String clientIp) {
        rateLimiterService.checkRegisterResendIpLimit(clientIp);

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ValidationException("confirmPassword", "Passwords do not match.");
        }

        String normalizedEmail = EmailNormalizer.normalize(request.getEmail());
        String normalizedUsername = request.getUsername().trim().toLowerCase();

        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (existingUserOpt.isPresent()) {
            User existing = existingUserOpt.get();
            // If unverified password user and eligible for resend, send replacement OTP silently
            if (existing.getPasswordHash() != null
                    && !existing.isEmailVerified()
                    && existing.getStatus() != AccountStatus.DISABLED) {
                if (emailVerificationService.canResend(existing)) {
                    String otp = emailVerificationService.issueOtp(existing);
                    eventPublisher.publishEvent(new EmailVerificationEvent(existing.getEmail(), existing.getFullName(), otp));
                }
                return new RegistrationAcceptedResponse(normalizedEmail, true);
            }
            throw new EmailAlreadyRegisteredException("If the email is eligible, a 6-digit verification code has been sent.");
        }

        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new UsernameAlreadyTakenException("That username is already taken.");
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        String fullName = (request.getFullName() != null) ? request.getFullName().trim() : "";

        User newMentor = userProvisioningService.createMentorUser(
                normalizedEmail,
                normalizedUsername,
                fullName,
                encodedPassword
        );

        String otp = emailVerificationService.issueOtp(newMentor);
        eventPublisher.publishEvent(new EmailVerificationEvent(newMentor.getEmail(), newMentor.getFullName(), otp));

        return new RegistrationAcceptedResponse(normalizedEmail, true);
    }
}
