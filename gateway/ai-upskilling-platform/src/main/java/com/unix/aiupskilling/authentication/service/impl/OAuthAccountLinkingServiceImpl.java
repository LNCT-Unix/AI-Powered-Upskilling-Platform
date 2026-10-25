package com.unix.aiupskilling.authentication.service.impl;

import com.unix.aiupskilling.authentication.exception.OAuthLoginException;
import com.unix.aiupskilling.authentication.model.OAuthIdentity;
import com.unix.aiupskilling.authentication.model.entity.OAuthAccount;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.repository.OAuthAccountRepository;
import com.unix.aiupskilling.authentication.repository.RefreshTokenRepository;
import com.unix.aiupskilling.authentication.service.AccountEligibilityService;
import com.unix.aiupskilling.authentication.service.OAuthAccountLinkingService;
import com.unix.aiupskilling.authentication.service.UserProvisioningService;
import com.unix.aiupskilling.shared.exception.ResourceNotFoundException;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OAuthAccountLinkingServiceImpl implements OAuthAccountLinkingService {

    private static final Logger log = LoggerFactory.getLogger(OAuthAccountLinkingServiceImpl.class);

    private final OAuthAccountRepository oauthAccountRepository;
    private final UserRepository userRepository;
    private final UserProvisioningService userProvisioningService;
    private final AccountEligibilityService accountEligibilityService;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    @Transactional
    public User resolve(OAuthIdentity identity, Optional<Long> linkIntentUserId) {
        if (identity == null) {
            throw new OAuthLoginException("OAUTH_PROVIDER_ERROR", "Identity cannot be null");
        }

        // 1. Check existing (provider, providerSubject) mapping
        Optional<OAuthAccount> existingAccountOpt = oauthAccountRepository
                .findByProviderAndProviderSubject(identity.provider(), identity.subject());

        if (existingAccountOpt.isPresent()) {
            OAuthAccount account = existingAccountOpt.get();
            User user = account.getUser();

            if (linkIntentUserId.isPresent()) {
                if (!linkIntentUserId.get().equals(user.getId())) {
                    throw new OAuthLoginException("OAUTH_ALREADY_LINKED", "This account is already linked to another user");
                }
            }

            accountEligibilityService.assertCanAuthenticate(user);

            account.setLastLoginAt(LocalDateTime.now());
            if (identity.email() != null) {
                account.setProviderEmail(identity.email());
                account.setProviderEmailVerified(identity.emailVerified());
            }
            oauthAccountRepository.save(account);
            return user;
        }

        // 2. No mapping found. Check if this is an explicit linking request
        if (linkIntentUserId.isPresent()) {
            Long targetUserId = linkIntentUserId.get();
            User targetUser = userRepository.findById(targetUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

            accountEligibilityService.assertCanAuthenticate(targetUser);

            if (oauthAccountRepository.existsByUserIdAndProvider(targetUserId, identity.provider())) {
                throw new OAuthLoginException("OAUTH_ALREADY_LINKED", "You already have an account linked for provider " + identity.provider());
            }

            OAuthAccount newAccount = OAuthAccount.builder()
                    .user(targetUser)
                    .provider(identity.provider())
                    .providerSubject(identity.subject())
                    .providerEmail(identity.email())
                    .providerEmailVerified(identity.emailVerified())
                    .createdAt(LocalDateTime.now())
                    .lastLoginAt(LocalDateTime.now())
                    .build();

            oauthAccountRepository.save(newAccount);
            return targetUser;
        }

        // 3. Normal login (no existing mapping, no explicit intent)
        if (identity.email() == null || identity.email().isBlank()) {
            throw new OAuthLoginException("OAUTH_EMAIL_REQUIRED", "Verified email is required from provider");
        }

        if (!identity.emailVerified()) {
            throw new OAuthLoginException("OAUTH_EMAIL_UNVERIFIED", "Email returned by provider is not verified");
        }

        Optional<User> existingUserOpt = userProvisioningService.findByEmail(identity.email());

        if (existingUserOpt.isEmpty()) {
            User newUser = userProvisioningService.createOAuthUser(identity.email(), identity.displayName());
            OAuthAccount newAccount = OAuthAccount.builder()
                    .user(newUser)
                    .provider(identity.provider())
                    .providerSubject(identity.subject())
                    .providerEmail(identity.email())
                    .providerEmailVerified(true)
                    .createdAt(LocalDateTime.now())
                    .lastLoginAt(LocalDateTime.now())
                    .build();

            oauthAccountRepository.save(newAccount);
            return newUser;
        }

        User existingUser = existingUserOpt.get();

        if (existingUser.getStatus() == AccountStatus.DISABLED) {
            throw new OAuthLoginException("OAUTH_ACCOUNT_DISABLED", "Account is disabled");
        }

        if (existingUser.isEmailVerified()) {
            log.warn("OAuth login collision: verified user exists with email {} but no mapping for {}/{}",
                    existingUser.getEmail(), identity.provider(), identity.subject());
            throw new OAuthLoginException("OAUTH_ACCOUNT_EXISTS",
                    "An account with this email already exists. Please log in with your existing credentials and link your " + identity.provider() + " account.");
        }

        if (existingUser.getPasswordHash() != null) {
            log.info("Reclaiming unverified password account for email {} via verified OAuth provider {}",
                    existingUser.getEmail(), identity.provider());
            existingUser.setPasswordHash(null);
            existingUser.setEmailVerified(true);
            existingUser.setEmailVerifiedAt(LocalDateTime.now());
            userRepository.save(existingUser);

            refreshTokenRepository.findByUserId(existingUser.getId()).forEach(t -> {
                t.setRevokedAt(LocalDateTime.now());
                refreshTokenRepository.save(t);
            });

            OAuthAccount newAccount = OAuthAccount.builder()
                    .user(existingUser)
                    .provider(identity.provider())
                    .providerSubject(identity.subject())
                    .providerEmail(identity.email())
                    .providerEmailVerified(true)
                    .createdAt(LocalDateTime.now())
                    .lastLoginAt(LocalDateTime.now())
                    .build();

            oauthAccountRepository.save(newAccount);
            return existingUser;
        }

        throw new OAuthLoginException("OAUTH_ACCOUNT_EXISTS", "Account already exists");
    }
}
