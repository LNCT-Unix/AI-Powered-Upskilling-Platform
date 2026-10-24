package com.unix.ai_upskilling_platform.authentication.service.impl;

import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.unix.ai_upskilling_platform.authentication.config.AuthProperties;
import com.unix.ai_upskilling_platform.authentication.dto.response.AuthTokens;
import com.unix.ai_upskilling_platform.authentication.exception.InvalidLoginCodeException;
import com.unix.ai_upskilling_platform.authentication.exception.InvalidRefreshTokenException;
import com.unix.ai_upskilling_platform.authentication.model.entity.OAuthLoginCode;
import com.unix.ai_upskilling_platform.authentication.model.entity.RefreshToken;
import com.unix.ai_upskilling_platform.authentication.model.enums.ClientPlatform;
import com.unix.ai_upskilling_platform.authentication.repository.OAuthLoginCodeRepository;
import com.unix.ai_upskilling_platform.authentication.repository.RefreshTokenRepository;
import com.unix.ai_upskilling_platform.authentication.service.AccountEligibilityService;
import com.unix.ai_upskilling_platform.authentication.service.AuthTokenService;
import com.unix.ai_upskilling_platform.authentication.util.TokenHashUtil;
import com.unix.ai_upskilling_platform.dto.response.UserResponse;
import com.unix.ai_upskilling_platform.exception.ResourceNotFoundException;
import com.unix.ai_upskilling_platform.model.entity.User;
import com.unix.ai_upskilling_platform.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthTokenServiceImpl implements AuthTokenService {

    private static final Logger log = LoggerFactory.getLogger(AuthTokenServiceImpl.class);

    private final AuthProperties authProperties;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OAuthLoginCodeRepository oAuthLoginCodeRepository;
    private final UserRepository userRepository;
    private final AccountEligibilityService accountEligibilityService;

    private final SecureRandom secureRandom = new SecureRandom();
    private byte[] jwtSecretBytes;

    @PostConstruct
    public void init() {
        String secret = authProperties.getJwt().getSecret();
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("app.auth.jwt.secret must be at least 32 bytes (256 bits) long.");
        }
        this.jwtSecretBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    @Transactional
    public AuthTokens issueTokens(User user, ClientPlatform platform) {
        accountEligibilityService.assertCanAuthenticate(user);

        ClientPlatform resolvedPlatform = (platform != null) ? platform : ClientPlatform.WEB;
        String accessToken = generateAccessToken(user);
        String rawRefreshToken = generateRandomTokenString(32);
        String tokenHash = TokenHashUtil.sha256(rawRefreshToken);
        String familyId = UUID.randomUUID().toString();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(authProperties.getJwt().getRefreshTokenTtlSeconds());

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(tokenHash)
                .familyId(familyId)
                .platform(resolvedPlatform)
                .createdAt(now)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshTokenEntity);

        return AuthTokens.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresInSeconds(authProperties.getJwt().getAccessTokenTtlSeconds())
                .refreshToken(rawRefreshToken)
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    @Transactional
    public AuthTokens refresh(String rawRefreshToken, ClientPlatform platform) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new InvalidRefreshTokenException("Refresh token is required");
        }

        String hash = TokenHashUtil.sha256(rawRefreshToken);
        RefreshToken oldToken = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidRefreshTokenException("Invalid refresh token"));

        LocalDateTime now = LocalDateTime.now();

        if (oldToken.isRevoked()) {
            log.warn("Refresh token reuse detected for familyId={}. Revoking entire token family.", oldToken.getFamilyId());
            revokeFamily(oldToken.getFamilyId());
            throw new InvalidRefreshTokenException("Invalid refresh token: token replay detected");
        }

        if (oldToken.isExpired()) {
            throw new InvalidRefreshTokenException("Refresh token has expired");
        }

        User user = userRepository.findById(oldToken.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + oldToken.getUserId()));

        accountEligibilityService.assertCanAuthenticate(user);

        oldToken.setRevokedAt(now);

        String newRawRefreshToken = generateRandomTokenString(32);
        String newHash = TokenHashUtil.sha256(newRawRefreshToken);
        LocalDateTime newExpiresAt = now.plusSeconds(authProperties.getJwt().getRefreshTokenTtlSeconds());

        ClientPlatform targetPlatform = (platform != null) ? platform : oldToken.getPlatform();

        RefreshToken newToken = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(newHash)
                .familyId(oldToken.getFamilyId())
                .platform(targetPlatform)
                .createdAt(now)
                .expiresAt(newExpiresAt)
                .build();

        RefreshToken savedNewToken = refreshTokenRepository.save(newToken);
        oldToken.setReplacedById(savedNewToken.getId());
        refreshTokenRepository.save(oldToken);

        String newAccessToken = generateAccessToken(user);

        return AuthTokens.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .expiresInSeconds(authProperties.getJwt().getAccessTokenTtlSeconds())
                .refreshToken(newRawRefreshToken)
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    @Transactional
    public void revoke(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        String hash = TokenHashUtil.sha256(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> revokeFamily(token.getFamilyId()));
    }

    @Override
    @Transactional
    public void revokeAllFor(Long userId) {
        if (userId == null) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        List<RefreshToken> tokens = refreshTokenRepository.findByUserId(userId);
        for (RefreshToken token : tokens) {
            if (token.getRevokedAt() == null) {
                token.setRevokedAt(now);
            }
        }
        refreshTokenRepository.saveAll(tokens);
    }

    @Override
    @Transactional
    public String createLoginCode(User user, ClientPlatform platform) {
        accountEligibilityService.assertCanAuthenticate(user);

        ClientPlatform resolvedPlatform = (platform != null) ? platform : ClientPlatform.WEB;
        String rawCode = generateRandomTokenString(32);
        String hash = TokenHashUtil.sha256(rawCode);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(authProperties.getJwt().getLoginCodeTtlSeconds());

        OAuthLoginCode codeEntity = OAuthLoginCode.builder()
                .userId(user.getId())
                .platform(resolvedPlatform)
                .codeHash(hash)
                .createdAt(now)
                .expiresAt(expiresAt)
                .build();

        oAuthLoginCodeRepository.save(codeEntity);
        return rawCode;
    }

    @Override
    @Transactional
    public AuthTokens exchangeLoginCode(String rawCode) {
        if (rawCode == null || rawCode.isBlank()) {
            throw new InvalidLoginCodeException("Login code is required");
        }

        String hash = TokenHashUtil.sha256(rawCode);
        OAuthLoginCode loginCode = oAuthLoginCodeRepository.findByCodeHash(hash)
                .orElseThrow(() -> new InvalidLoginCodeException("Invalid login code"));

        if (!loginCode.isValid()) {
            throw new InvalidLoginCodeException("Login code is expired or has already been used");
        }

        loginCode.setConsumedAt(LocalDateTime.now());
        oAuthLoginCodeRepository.save(loginCode);

        User user = userRepository.findById(loginCode.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + loginCode.getUserId()));

        return issueTokens(user, loginCode.getPlatform());
    }

    @Override
    public User parseAndValidateToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            MACVerifier verifier = new MACVerifier(jwtSecretBytes);
            if (!signedJWT.verify(verifier)) {
                return null;
            }

            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (expirationTime == null || expirationTime.before(new Date())) {
                return null;
            }

            String subject = signedJWT.getJWTClaimsSet().getSubject();
            if (subject == null) {
                return null;
            }

            Long userId = Long.valueOf(subject);
            return userRepository.findById(userId).orElse(null);
        } catch (Exception e) {
            log.debug("Token parsing/validation failed: {}", e.getMessage());
            return null;
        }
    }

    private void revokeFamily(String familyId) {
        LocalDateTime now = LocalDateTime.now();
        List<RefreshToken> tokens = refreshTokenRepository.findByFamilyId(familyId);
        for (RefreshToken token : tokens) {
            if (token.getRevokedAt() == null) {
                token.setRevokedAt(now);
            }
        }
        refreshTokenRepository.saveAll(tokens);
    }

    private String generateAccessToken(User user) {
        try {
            Instant now = Instant.now();
            long ttl = authProperties.getJwt().getAccessTokenTtlSeconds();

            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.HS256)
                    .type(JOSEObjectType.JWT)
                    .build();

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .issuer(authProperties.getJwt().getIssuer())
                    .subject(String.valueOf(user.getId()))
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(now.plusSeconds(ttl)))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("roles", List.of(user.getRole().name()))
                    .build();

            SignedJWT signedJWT = new SignedJWT(header, claimsSet);
            signedJWT.sign(new MACSigner(jwtSecretBytes));
            return signedJWT.serialize();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate JWT access token", e);
        }
    }

    private String generateRandomTokenString(int byteLength) {
        byte[] bytes = new byte[byteLength];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}
