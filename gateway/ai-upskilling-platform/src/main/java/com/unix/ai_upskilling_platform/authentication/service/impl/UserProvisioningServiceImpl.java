package com.unix.ai_upskilling_platform.authentication.service.impl;

import com.unix.ai_upskilling_platform.authentication.exception.EmailAlreadyRegisteredException;
import com.unix.ai_upskilling_platform.authentication.model.enums.AccountStatus;
import com.unix.ai_upskilling_platform.authentication.service.UserProvisioningService;
import com.unix.ai_upskilling_platform.authentication.util.EmailNormalizer;
import com.unix.ai_upskilling_platform.model.entity.User;
import com.unix.ai_upskilling_platform.model.enums.Role;
import com.unix.ai_upskilling_platform.repository.UserRepository;
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
}
