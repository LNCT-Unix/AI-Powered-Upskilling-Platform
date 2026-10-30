package com.unix.aiupskilling.authentication.service.impl;

import com.unix.aiupskilling.authentication.exception.EmailAlreadyRegisteredException;
import com.unix.aiupskilling.authentication.exception.UsernameAlreadyTakenException;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.service.UserProvisioningService;
import com.unix.aiupskilling.authentication.util.EmailNormalizer;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.Role;
import com.unix.aiupskilling.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserProvisioningServiceImpl implements UserProvisioningService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String rawEmail) {
        if (rawEmail == null) {
            return Optional.empty();
        }
        String normalized = EmailNormalizer.normalize(rawEmail);
        return userRepository.findByEmail(normalized);
    }

    @Override
    @Transactional
    public User createEmailUser(String rawEmail, String fullName, String passwordHash) {
        String normalized = EmailNormalizer.normalize(rawEmail);
        if (userRepository.existsByEmail(normalized)) {
            throw new EmailAlreadyRegisteredException("Email is already registered: " + normalized);
        }

        User user = User.builder()
                .email(normalized)
                .fullName(fullName)
                .passwordHash(passwordHash)
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(false)
                .build();

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User createOAuthUser(String verifiedEmail, String fullName) {
        String normalized = EmailNormalizer.normalize(verifiedEmail);
        if (userRepository.existsByEmail(normalized)) {
            throw new EmailAlreadyRegisteredException("Email is already registered: " + normalized);
        }

        User user = User.builder()
                .email(normalized)
                .fullName(fullName)
                .passwordHash(null)
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .emailVerifiedAt(LocalDateTime.now())
                .build();

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User createMentorUser(String rawEmail, String username, String fullName, String passwordHash) {
        String normalizedEmail = EmailNormalizer.normalize(rawEmail);
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyRegisteredException("If the email is eligible, a 6-digit verification code has been sent.");
        }

        String normalizedUsername = (username != null) ? username.trim().toLowerCase() : null;
        if (normalizedUsername != null && userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new UsernameAlreadyTakenException("That username is already taken.");
        }

        User user = User.builder()
                .email(normalizedEmail)
                .username(normalizedUsername)
                .fullName(fullName != null ? fullName.trim() : "")
                .passwordHash(passwordHash)
                .role(Role.MENTOR)
                .status(AccountStatus.ACTIVE)
                .emailVerified(false)
                .build();

        return userRepository.save(user);
    }
}
