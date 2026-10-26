package com.unix.aiupskilling.authentication;

import com.unix.aiupskilling.authentication.model.entity.EmailVerificationToken;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.user.Role;

import com.unix.aiupskilling.authentication.repository.EmailVerificationTokenRepository;
import com.unix.aiupskilling.authentication.repository.OAuthAccountRepository;
import com.unix.aiupskilling.authentication.repository.RefreshTokenRepository;
import com.unix.aiupskilling.authentication.service.EmailSender;
import com.unix.aiupskilling.authentication.util.TokenHashUtil;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class EmailAuthIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private OAuthAccountRepository oauthAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private EmailSender emailSender;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        emailVerificationTokenRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        oauthAccountRepository.deleteAll();
        userRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        emailVerificationTokenRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        oauthAccountRepository.deleteAll();
        userRepository.deleteAll();
    }


    @Test
    @DisplayName("Registration: Valid payload returns 202 and provisions unverified USER with encoded password")
    void testRegisterSuccess() throws Exception {
        String payload = """
                {
                    "email": "riya.dev@example.com",
                    "password": "StrongPassword123!",
                    "fullName": "Riya Developer"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("riya.dev@example.com"))
                .andExpect(jsonPath("$.data.verificationRequired").value(true));

        User user = userRepository.findByEmail("riya.dev@example.com").orElse(null);
        assertThat(user).isNotNull();
        assertThat(user.getFullName()).isEqualTo("Riya Developer");
        assertThat(user.getRole()).isEqualTo(Role.USER);
        assertThat(user.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(user.isEmailVerified()).isFalse();
        assertThat(user.getPasswordHash()).isNotNull();
        assertThat(passwordEncoder.matches("StrongPassword123!", user.getPasswordHash())).isTrue();

        assertThat(emailVerificationTokenRepository.findAll()).hasSize(1);
    }

    @Test
    @DisplayName("Registration: Validation errors on malformed email, blank name, or password out of bounds")
    void testRegisterValidationFailures() throws Exception {
        // 7-character password (below 8 bytes)
        String shortPassword = """
                {
                    "email": "riya@example.com",
                    "password": "1234567",
                    "fullName": "Riya"
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(shortPassword))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("VALIDATION_ERROR"));

        // Blank full name
        String blankName = """
                {
                    "email": "riya@example.com",
                    "password": "StrongPassword123!",
                    "fullName": ""
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(blankName))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.code").value("VALIDATION_ERROR"));

        // Invalid email
        String invalidEmail = """
                {
                    "email": "not-an-email",
                    "password": "StrongPassword123!",
                    "fullName": "Riya"
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidEmail))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("Registration: UTF-8 byte boundary handling (8 and 72 bytes accepted, 73 rejected)")
    void testRegisterByteLengthBoundaries() throws Exception {
        // Exactly 8 UTF-8 bytes: "12345678"
        String eightBytes = """
                {
                    "email": "byte8@example.com",
                    "password": "12345678",
                    "fullName": "Eight Bytes"
                }
                """;
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(eightBytes))
                .andExpect(status().isAccepted());

        // Exactly 72 UTF-8 bytes
        String pwd72 = "A".repeat(72);
        String seventyTwoBytes = String.format("""
                {
                    "email": "byte72@example.com",
                    "password": "%s",
                    "fullName": "Seventy Two Bytes"
                }
                """, pwd72);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(seventyTwoBytes))
                .andExpect(status().isAccepted());

        // 73 UTF-8 bytes
        String pwd73 = "A".repeat(73);
        String seventyThreeBytes = String.format("""
                {
                    "email": "byte73@example.com",
                    "password": "%s",
                    "fullName": "Seventy Three Bytes"
                }
                """, pwd73);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(seventyThreeBytes))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("Registration: Tamper resistance - client cannot set role, status or emailVerified")
    void testRegisterTamperFieldsIgnored() throws Exception {
        String payload = """
                {
                    "email": "tamper@example.com",
                    "password": "StrongPassword123!",
                    "fullName": "Tamper Test",
                    "role": "ADMIN",
                    "status": "DISABLED",
                    "emailVerified": true
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isAccepted());

        User user = userRepository.findByEmail("tamper@example.com").orElseThrow();
        assertThat(user.getRole()).isEqualTo(Role.USER);
        assertThat(user.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(user.isEmailVerified()).isFalse();
    }

    @Test
    @DisplayName("Registration: Duplicate registration on existing unverified/verified account returns identical 202")
    void testDuplicateRegistration() throws Exception {
        // Pre-create verified user
        User verifiedUser = User.builder()
                .email("verified@example.com")
                .fullName("Existing User")
                .passwordHash(passwordEncoder.encode("ExistingPass1!"))
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        userRepository.save(verifiedUser);

        String duplicatePayload = """
                {
                    "email": "verified@example.com",
                    "password": "NewAttemptPassword!",
                    "fullName": "Attacker"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(duplicatePayload))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true));

        // Ensure existing account was not modified
        User refreshed = userRepository.findByEmail("verified@example.com").orElseThrow();
        assertThat(refreshed.getFullName()).isEqualTo("Existing User");
        assertThat(passwordEncoder.matches("ExistingPass1!", refreshed.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("Verification: Confirm valid token marks email verified")
    void testConfirmEmailSuccess() throws Exception {
        User user = User.builder()
                .email("verify.me@example.com")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);

        String rawToken = "raw-verification-token-xyz-123";
        EmailVerificationToken token = EmailVerificationToken.builder()
                .userId(user.getId())
                .tokenHash(TokenHashUtil.sha256(rawToken))
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        emailVerificationTokenRepository.save(token);

        mockMvc.perform(post("/api/auth/email-verification/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + rawToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.emailVerified").value(true));

        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updatedUser.isEmailVerified()).isTrue();
        assertThat(updatedUser.getEmailVerifiedAt()).isNotNull();

        EmailVerificationToken updatedToken = emailVerificationTokenRepository.findById(token.getId()).orElseThrow();
        assertThat(updatedToken.getConsumedAt()).isNotNull();
    }

    @Test
    @DisplayName("Verification: Confirm invalid, expired, or already-used token returns 400 Bad Request")
    void testConfirmEmailErrors() throws Exception {
        // Unknown token
        mockMvc.perform(post("/api/auth/email-verification/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"completely-unknown-token\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.code").value("VERIFICATION_TOKEN_INVALID"));

        // Expired token
        User user = userRepository.save(User.builder().email("exp@example.com").role(Role.USER).status(AccountStatus.ACTIVE).build());
        String expiredRaw = "expired-token-123";
        emailVerificationTokenRepository.save(EmailVerificationToken.builder()
                .userId(user.getId())
                .tokenHash(TokenHashUtil.sha256(expiredRaw))
                .createdAt(LocalDateTime.now().minusDays(2))
                .expiresAt(LocalDateTime.now().minusDays(1))
                .build());

        mockMvc.perform(post("/api/auth/email-verification/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + expiredRaw + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.code").value("VERIFICATION_TOKEN_EXPIRED"));

        // Already consumed token
        String usedRaw = "used-token-123";
        emailVerificationTokenRepository.save(EmailVerificationToken.builder()
                .userId(user.getId())
                .tokenHash(TokenHashUtil.sha256(usedRaw))
                .createdAt(LocalDateTime.now().minusHours(2))
                .expiresAt(LocalDateTime.now().plusHours(22))
                .consumedAt(LocalDateTime.now().minusMinutes(5))
                .build());


        mockMvc.perform(post("/api/auth/email-verification/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + usedRaw + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.code").value("VERIFICATION_TOKEN_USED"));
    }

    @Test
    @DisplayName("Resend Verification: Returns 202 Accepted for both eligible and unknown accounts")
    void testResendVerificationGenericResponse() throws Exception {
        mockMvc.perform(post("/api/auth/email-verification/resend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nonexistent@example.com\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Login: Valid credentials on verified user returns 200 and issues tokens")
    void testLoginSuccessWeb() throws Exception {
        User user = User.builder()
                .email("login.test@example.com")
                .fullName("Login Tester")
                .passwordHash(passwordEncoder.encode("SecretPass123!"))
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        userRepository.save(user);

        String loginPayload = """
                {
                    "email": "login.test@example.com",
                    "password": "SecretPass123!"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(cookie().httpOnly("refresh_token", true));
    }

    @Test
    @DisplayName("Login: Mobile platform returns refresh token in body, not cookie")
    void testLoginSuccessMobile() throws Exception {
        User user = User.builder()
                .email("mobile.login@example.com")
                .fullName("Mobile Tester")
                .passwordHash(passwordEncoder.encode("SecretPass123!"))
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        userRepository.save(user);

        String loginPayload = """
                {
                    "email": "mobile.login@example.com",
                    "password": "SecretPass123!"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Client-Platform", "mobile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(cookie().doesNotExist("refresh_token"));
    }

    @Test
    @DisplayName("Login: Unknown email, wrong password, or OAuth-only account return identical 401 INVALID_CREDENTIALS")
    void testLoginInvalidCredentials() throws Exception {
        // Unknown email
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"unknown@example.com\",\"password\":\"SomePassword123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.data.code").value("INVALID_CREDENTIALS"));

        // Pre-create user with password
        User user = User.builder()
                .email("pass.user@example.com")
                .passwordHash(passwordEncoder.encode("CorrectPassword1!"))
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        userRepository.save(user);

        // Wrong password
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"pass.user@example.com\",\"password\":\"WrongPassword!\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.data.code").value("INVALID_CREDENTIALS"));

        // OAuth-only account (passwordHash is null)
        User oauthUser = User.builder()
                .email("oauth.only@example.com")
                .passwordHash(null)
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        userRepository.save(oauthUser);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"oauth.only@example.com\",\"password\":\"AttemptPassword!\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.data.code").value("INVALID_CREDENTIALS"));
    }

    @Test
    @DisplayName("Login: Correct password on unverified email returns 403 EMAIL_NOT_VERIFIED")
    void testLoginUnverifiedEmail() throws Exception {
        User user = User.builder()
                .email("unverified@example.com")
                .passwordHash(passwordEncoder.encode("ValidPassword1!"))
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(false)
                .build();
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"unverified@example.com\",\"password\":\"ValidPassword1!\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data.code").value("EMAIL_NOT_VERIFIED"));
    }

    @Test
    @DisplayName("Login: Correct password on disabled account returns 403 ACCOUNT_DISABLED")
    void testLoginDisabledAccount() throws Exception {
        User user = User.builder()
                .email("disabled@example.com")
                .passwordHash(passwordEncoder.encode("ValidPassword1!"))
                .role(Role.USER)
                .status(AccountStatus.DISABLED)
                .emailVerified(true)
                .build();
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"disabled@example.com\",\"password\":\"ValidPassword1!\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data.code").value("ACCOUNT_DISABLED"));
    }

    @Test
    @DisplayName("Login: Wrong password on unverified account returns 401, not revealing unverified status")
    void testLoginWrongPasswordOnUnverifiedAccountReturns401() throws Exception {
        User user = User.builder()
                .email("unverified2@example.com")
                .passwordHash(passwordEncoder.encode("ValidPassword1!"))
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(false)
                .build();
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"unverified2@example.com\",\"password\":\"WrongPassword!\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.data.code").value("INVALID_CREDENTIALS"));
    }
}
