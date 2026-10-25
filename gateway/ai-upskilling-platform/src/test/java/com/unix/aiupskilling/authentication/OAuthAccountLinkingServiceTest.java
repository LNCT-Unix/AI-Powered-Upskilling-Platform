package com.unix.aiupskilling.authentication;

import com.unix.aiupskilling.authentication.exception.AccountNotEligibleException;
import com.unix.aiupskilling.authentication.exception.OAuthLoginException;
import com.unix.aiupskilling.authentication.model.OAuthIdentity;
import com.unix.aiupskilling.authentication.model.entity.OAuthAccount;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.model.enums.OAuthProvider;
import com.unix.aiupskilling.authentication.repository.OAuthAccountRepository;
import com.unix.aiupskilling.authentication.repository.RefreshTokenRepository;
import com.unix.aiupskilling.authentication.service.AccountEligibilityService;
import com.unix.aiupskilling.authentication.service.UserProvisioningService;
import com.unix.aiupskilling.authentication.service.impl.AccountEligibilityServiceImpl;
import com.unix.aiupskilling.authentication.service.impl.OAuthAccountLinkingServiceImpl;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.Role;
import com.unix.aiupskilling.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuthAccountLinkingServiceTest {

    @Mock
    private OAuthAccountRepository oauthAccountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProvisioningService userProvisioningService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private AccountEligibilityService accountEligibilityService;
    private OAuthAccountLinkingServiceImpl linkingService;

    @BeforeEach
    void setUp() {
        accountEligibilityService = new AccountEligibilityServiceImpl();
        linkingService = new OAuthAccountLinkingServiceImpl(
                oauthAccountRepository,
                userRepository,
                userProvisioningService,
                accountEligibilityService,
                refreshTokenRepository
        );
    }

    @Test
    @DisplayName("Row 1: Repeat login with existing provider mapping returns user without creating duplicates")
    void testRepeatLogin() {
        User user = User.builder().id(1L).email("user@example.com").status(AccountStatus.ACTIVE).role(Role.USER).build();
        OAuthAccount account = OAuthAccount.builder().id(10L).user(user).provider(OAuthProvider.GOOGLE).providerSubject("google-sub-123").build();

        when(oauthAccountRepository.findByProviderAndProviderSubject(OAuthProvider.GOOGLE, "google-sub-123"))
                .thenReturn(Optional.of(account));

        OAuthIdentity identity = new OAuthIdentity(OAuthProvider.GOOGLE, "google-sub-123", "user@example.com", true, "Test User");

        User resolved = linkingService.resolve(identity, Optional.empty());

        assertThat(resolved).isNotNull();
        assertThat(resolved.getId()).isEqualTo(1L);
        verify(userProvisioningService, never()).createOAuthUser(any(), any());
    }

    @Test
    @DisplayName("Row 2: Reject provider login when email is missing")
    void testMissingEmailRejected() {
        when(oauthAccountRepository.findByProviderAndProviderSubject(any(), any())).thenReturn(Optional.empty());

        OAuthIdentity identity = new OAuthIdentity(OAuthProvider.GITHUB, "github-999", null, false, "Dev");

        assertThatThrownBy(() -> linkingService.resolve(identity, Optional.empty()))
                .isInstanceOf(OAuthLoginException.class)
                .matches(e -> ((OAuthLoginException) e).getCode().equals("OAUTH_EMAIL_REQUIRED"));
    }

    @Test
    @DisplayName("Row 3: Reject provider login when email is unverified")
    void testUnverifiedEmailRejected() {
        when(oauthAccountRepository.findByProviderAndProviderSubject(any(), any())).thenReturn(Optional.empty());

        OAuthIdentity identity = new OAuthIdentity(OAuthProvider.GOOGLE, "google-456", "unverified@example.com", false, "Unverified");

        assertThatThrownBy(() -> linkingService.resolve(identity, Optional.empty()))
                .isInstanceOf(OAuthLoginException.class)
                .matches(e -> ((OAuthLoginException) e).getCode().equals("OAUTH_EMAIL_UNVERIFIED"));
    }

    @Test
    @DisplayName("Row 4: First-time login with verified email provisions user and links OAuthAccount")
    void testFirstTimeLogin() {
        when(oauthAccountRepository.findByProviderAndProviderSubject(any(), any())).thenReturn(Optional.empty());
        when(userProvisioningService.findByEmail("new@example.com")).thenReturn(Optional.empty());

        User newUser = User.builder().id(50L).email("new@example.com").role(Role.USER).status(AccountStatus.ACTIVE).emailVerified(true).build();
        when(userProvisioningService.createOAuthUser("new@example.com", "New User")).thenReturn(newUser);
        when(oauthAccountRepository.save(any(OAuthAccount.class))).thenAnswer(i -> i.getArgument(0));

        OAuthIdentity identity = new OAuthIdentity(OAuthProvider.GOOGLE, "google-new-1", "new@example.com", true, "New User");

        User resolved = linkingService.resolve(identity, Optional.empty());

        assertThat(resolved).isNotNull();
        assertThat(resolved.getId()).isEqualTo(50L);
        verify(oauthAccountRepository).save(any(OAuthAccount.class));
    }

    @Test
    @DisplayName("Row 5: Existing verified user with same email cannot be auto-linked (prevents takeover)")
    void testExistingVerifiedUserCollisionRejected() {
        when(oauthAccountRepository.findByProviderAndProviderSubject(any(), any())).thenReturn(Optional.empty());

        User existingVerified = User.builder()
                .id(20L)
                .email("exist@example.com")
                .emailVerified(true)
                .status(AccountStatus.ACTIVE)
                .build();
        when(userProvisioningService.findByEmail("exist@example.com")).thenReturn(Optional.of(existingVerified));

        OAuthIdentity identity = new OAuthIdentity(OAuthProvider.GITHUB, "github-coll-1", "exist@example.com", true, "Coll");

        assertThatThrownBy(() -> linkingService.resolve(identity, Optional.empty()))
                .isInstanceOf(OAuthLoginException.class)
                .matches(e -> ((OAuthLoginException) e).getCode().equals("OAUTH_ACCOUNT_EXISTS"));

        verify(oauthAccountRepository, never()).save(any(OAuthAccount.class));
    }

    @Test
    @DisplayName("Row 6 (D-5): Reclaim unverified password-only account when proven by verified OAuth provider")
    void testReclaimUnverifiedAccount() {
        when(oauthAccountRepository.findByProviderAndProviderSubject(any(), any())).thenReturn(Optional.empty());

        User unverifiedUser = User.builder()
                .id(30L)
                .email("unverified@example.com")
                .passwordHash("some-password-hash")
                .emailVerified(false)
                .status(AccountStatus.ACTIVE)
                .build();

        when(userProvisioningService.findByEmail("unverified@example.com")).thenReturn(Optional.of(unverifiedUser));
        when(refreshTokenRepository.findByUserId(30L)).thenReturn(List.of());
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(oauthAccountRepository.save(any(OAuthAccount.class))).thenAnswer(i -> i.getArgument(0));

        OAuthIdentity identity = new OAuthIdentity(OAuthProvider.GOOGLE, "google-reclaim-1", "unverified@example.com", true, "Reclaim");

        User resolved = linkingService.resolve(identity, Optional.empty());

        assertThat(resolved).isNotNull();
        assertThat(resolved.getId()).isEqualTo(30L);
        assertThat(unverifiedUser.getPasswordHash()).isNull();
        assertThat(unverifiedUser.isEmailVerified()).isTrue();
        verify(oauthAccountRepository).save(any(OAuthAccount.class));
    }

    @Test
    @DisplayName("Row 7: Explicit linking links provider to currently authenticated user")
    void testExplicitLinkSuccess() {
        when(oauthAccountRepository.findByProviderAndProviderSubject(any(), any())).thenReturn(Optional.empty());

        User authUser = User.builder().id(40L).email("auth@example.com").status(AccountStatus.ACTIVE).build();
        when(userRepository.findById(40L)).thenReturn(Optional.of(authUser));
        when(oauthAccountRepository.existsByUserIdAndProvider(40L, OAuthProvider.GITHUB)).thenReturn(false);
        when(oauthAccountRepository.save(any(OAuthAccount.class))).thenAnswer(i -> i.getArgument(0));

        OAuthIdentity identity = new OAuthIdentity(OAuthProvider.GITHUB, "github-link-1", "other@example.com", true, "Dev");

        User resolved = linkingService.resolve(identity, Optional.of(40L));

        assertThat(resolved.getId()).isEqualTo(40L);
        verify(oauthAccountRepository).save(any(OAuthAccount.class));
    }

    @Test
    @DisplayName("Row 8: Explicit link rejected if identity already linked to another user")
    void testExplicitLinkAlreadyLinkedElsewhereRejected() {
        User otherUser = User.builder().id(99L).email("other@example.com").status(AccountStatus.ACTIVE).build();
        OAuthAccount existingAccount = OAuthAccount.builder().id(5L).user(otherUser).provider(OAuthProvider.GOOGLE).providerSubject("sub-99").build();

        when(oauthAccountRepository.findByProviderAndProviderSubject(OAuthProvider.GOOGLE, "sub-99"))
                .thenReturn(Optional.of(existingAccount));

        OAuthIdentity identity = new OAuthIdentity(OAuthProvider.GOOGLE, "sub-99", "test@example.com", true, "User");

        assertThatThrownBy(() -> linkingService.resolve(identity, Optional.of(40L)))
                .isInstanceOf(OAuthLoginException.class)
                .matches(e -> ((OAuthLoginException) e).getCode().equals("OAUTH_ALREADY_LINKED"));
    }

    @Test
    @DisplayName("Row 9: Disabled account is rejected on OAuth login")
    void testDisabledAccountRejected() {
        User disabledUser = User.builder().id(12L).email("dis@example.com").status(AccountStatus.DISABLED).build();
        OAuthAccount account = OAuthAccount.builder().id(2L).user(disabledUser).provider(OAuthProvider.GOOGLE).providerSubject("sub-dis").build();

        when(oauthAccountRepository.findByProviderAndProviderSubject(OAuthProvider.GOOGLE, "sub-dis"))
                .thenReturn(Optional.of(account));

        OAuthIdentity identity = new OAuthIdentity(OAuthProvider.GOOGLE, "sub-dis", "dis@example.com", true, "Dis");

        assertThatThrownBy(() -> linkingService.resolve(identity, Optional.empty()))
                .isInstanceOf(AccountNotEligibleException.class)
                .matches(e -> ((AccountNotEligibleException) e).getCode().equals("ACCOUNT_DISABLED"));
    }
}
