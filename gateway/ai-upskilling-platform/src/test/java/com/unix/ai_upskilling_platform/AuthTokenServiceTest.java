package com.unix.ai_upskilling_platform;

import com.unix.ai_upskilling_platform.authentication.config.AuthProperties;
import com.unix.ai_upskilling_platform.authentication.dto.response.AuthTokens;
import com.unix.ai_upskilling_platform.authentication.exception.AccountNotEligibleException;
import com.unix.ai_upskilling_platform.authentication.exception.InvalidLoginCodeException;
import com.unix.ai_upskilling_platform.authentication.exception.InvalidRefreshTokenException;
import com.unix.ai_upskilling_platform.authentication.model.entity.OAuthLoginCode;
import com.unix.ai_upskilling_platform.authentication.model.entity.RefreshToken;
import com.unix.ai_upskilling_platform.authentication.model.enums.AccountStatus;
import com.unix.ai_upskilling_platform.authentication.model.enums.ClientPlatform;
import com.unix.ai_upskilling_platform.authentication.repository.OAuthLoginCodeRepository;
import com.unix.ai_upskilling_platform.authentication.repository.RefreshTokenRepository;
import com.unix.ai_upskilling_platform.authentication.service.AccountEligibilityService;
import com.unix.ai_upskilling_platform.authentication.service.impl.AccountEligibilityServiceImpl;
import com.unix.ai_upskilling_platform.authentication.service.impl.AuthTokenServiceImpl;
import com.unix.ai_upskilling_platform.model.entity.User;
import com.unix.ai_upskilling_platform.model.enums.Role;
import com.unix.ai_upskilling_platform.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private OAuthLoginCodeRepository oAuthLoginCodeRepository;

    @Mock
    private UserRepository userRepository;

    private AccountEligibilityService accountEligibilityService;
    private AuthProperties authProperties;
    private AuthTokenServiceImpl authTokenService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        accountEligibilityService = new AccountEligibilityServiceImpl();
        authProperties = new AuthProperties();
        authProperties.getJwt().setSecret("this-is-a-very-strong-secret-key-with-more-than-32-bytes");
        authProperties.getJwt().setAccessTokenTtlSeconds(900);
        authProperties.getJwt().setRefreshTokenTtlSeconds(2592000);
        authProperties.getJwt().setLoginCodeTtlSeconds(60);

        authTokenService = new AuthTokenServiceImpl(
                authProperties,
                refreshTokenRepository,
                oAuthLoginCodeRepository,
                userRepository,
                accountEligibilityService
        );
        authTokenService.init();

        activeUser = User.builder()
                .id(100L)
                .email("aadi@example.com")
                .fullName("Aadi Sharma")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
    }

    @Test
    @DisplayName("Fail startup if JWT secret is shorter than 32 bytes")
    void testWeakSecretFails() {
        AuthProperties weakProps = new AuthProperties();
        weakProps.getJwt().setSecret("too-short");

        AuthTokenServiceImpl service = new AuthTokenServiceImpl(
                weakProps,
                refreshTokenRepository,
                oAuthLoginCodeRepository,
                userRepository,
                accountEligibilityService
        );

        assertThatThrownBy(service::init)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 bytes");
    }

    @Test
    @DisplayName("Issue tokens successfully for active user")
    void testIssueTokens() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        AuthTokens tokens = authTokenService.issueTokens(activeUser, ClientPlatform.WEB);

        assertThat(tokens).isNotNull();
        assertThat(tokens.getAccessToken()).isNotBlank();
        assertThat(tokens.getTokenType()).isEqualTo("Bearer");
        assertThat(tokens.getExpiresInSeconds()).isEqualTo(900);
        assertThat(tokens.getRefreshToken()).isNotBlank();
        assertThat(tokens.getUser().getId()).isEqualTo(100L);

        when(userRepository.findById(100L)).thenReturn(Optional.of(activeUser));
        User parsed = authTokenService.parseAndValidateToken(tokens.getAccessToken());
        assertThat(parsed).isNotNull();
        assertThat(parsed.getId()).isEqualTo(100L);
    }

    @Test
    @DisplayName("Disabled user cannot be issued tokens")
    void testDisabledUserFails() {
        activeUser.setStatus(AccountStatus.DISABLED);

        assertThatThrownBy(() -> authTokenService.issueTokens(activeUser, ClientPlatform.WEB))
                .isInstanceOf(AccountNotEligibleException.class)
                .hasMessageContaining("disabled");
    }

    @Test
    @DisplayName("Refresh token rotation succeeds and invalidates old token")
    void testRefreshRotationSuccess() {
        String rawToken = "old-refresh-token-value";
        RefreshToken existingToken = RefreshToken.builder()
                .id(1L)
                .userId(100L)
                .familyId("family-123")
                .platform(ClientPlatform.WEB)
                .createdAt(LocalDateTime.now().minusDays(1))
                .expiresAt(LocalDateTime.now().plusDays(29))
                .build();

        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(existingToken));
        when(userRepository.findById(100L)).thenReturn(Optional.of(activeUser));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> {
            RefreshToken r = i.getArgument(0);
            if (r.getId() == null) {
                r.setId(2L);
            }
            return r;
        });

        AuthTokens newTokens = authTokenService.refresh(rawToken, ClientPlatform.WEB);

        assertThat(newTokens).isNotNull();
        assertThat(newTokens.getAccessToken()).isNotBlank();
        assertThat(newTokens.getRefreshToken()).isNotBlank();
        assertThat(newTokens.getRefreshToken()).isNotEqualTo(rawToken);

        assertThat(existingToken.getRevokedAt()).isNotNull();
        assertThat(existingToken.getReplacedById()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Token replay detection revokes entire token family")
    void testTokenReplayDetection() {
        String rawToken = "replayed-token-value";
        RefreshToken revokedToken = RefreshToken.builder()
                .id(1L)
                .userId(100L)
                .familyId("family-123")
                .platform(ClientPlatform.WEB)
                .createdAt(LocalDateTime.now().minusDays(2))
                .expiresAt(LocalDateTime.now().plusDays(28))
                .revokedAt(LocalDateTime.now().minusDays(1))
                .build();

        RefreshToken siblingToken = RefreshToken.builder()
                .id(2L)
                .userId(100L)
                .familyId("family-123")
                .platform(ClientPlatform.WEB)
                .createdAt(LocalDateTime.now().minusDays(1))
                .expiresAt(LocalDateTime.now().plusDays(29))
                .build();

        when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.of(revokedToken));
        when(refreshTokenRepository.findByFamilyId("family-123")).thenReturn(List.of(revokedToken, siblingToken));

        assertThatThrownBy(() -> authTokenService.refresh(rawToken, ClientPlatform.WEB))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .hasMessageContaining("replay detected");

        assertThat(siblingToken.getRevokedAt()).isNotNull();
        verify(refreshTokenRepository).saveAll(any());
    }

    @Test
    @DisplayName("OAuth login code single-use semantics")
    void testLoginCodeSingleUse() {
        when(oAuthLoginCodeRepository.save(any(OAuthLoginCode.class))).thenAnswer(i -> i.getArgument(0));

        String code = authTokenService.createLoginCode(activeUser, ClientPlatform.WEB);
        assertThat(code).isNotBlank();

        OAuthLoginCode codeEntity = OAuthLoginCode.builder()
                .id(10L)
                .userId(100L)
                .platform(ClientPlatform.WEB)
                .codeHash("dummy")
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusSeconds(60))
                .consumedAt(null)
                .build();

        when(oAuthLoginCodeRepository.findByCodeHash(any())).thenReturn(Optional.of(codeEntity));
        when(userRepository.findById(100L)).thenReturn(Optional.of(activeUser));

        AuthTokens tokens = authTokenService.exchangeLoginCode(code);
        assertThat(tokens).isNotNull();
        assertThat(codeEntity.getConsumedAt()).isNotNull();

        assertThatThrownBy(() -> authTokenService.exchangeLoginCode(code))
                .isInstanceOf(InvalidLoginCodeException.class)
                .hasMessageContaining("expired or has already been used");
    }
}
