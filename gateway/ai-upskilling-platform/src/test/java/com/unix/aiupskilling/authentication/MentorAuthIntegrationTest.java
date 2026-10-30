package com.unix.aiupskilling.authentication;

import com.unix.aiupskilling.authentication.dto.response.AuthTokens;
import com.unix.aiupskilling.authentication.model.entity.EmailVerificationToken;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import com.unix.aiupskilling.authentication.repository.EmailVerificationTokenRepository;
import com.unix.aiupskilling.authentication.repository.OAuthAccountRepository;
import com.unix.aiupskilling.authentication.repository.RefreshTokenRepository;
import com.unix.aiupskilling.authentication.service.AuthTokenService;
import com.unix.aiupskilling.authentication.service.EmailSender;
import com.unix.aiupskilling.mentor.repository.MentorProfileRepository;
import com.unix.aiupskilling.user.Role;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class MentorAuthIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MentorProfileRepository mentorProfileRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private OAuthAccountRepository oauthAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthTokenService authTokenService;

    @MockitoBean
    private EmailSender emailSender;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        cleanup();
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        emailVerificationTokenRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        oauthAccountRepository.deleteAll();
        mentorProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Mentor Registration: Valid payload returns 202, creates unverified user with Role.MENTOR and OTP")
    void testMentorRegisterSuccess() throws Exception {
        String payload = """
                {
                    "fullName": "Dr. Meera Kapoor",
                    "username": "meera.mentor",
                    "email": "meera.kapoor@example.com",
                    "password": "correct-horse-battery",
                    "confirmPassword": "correct-horse-battery"
                }
                """;

        mockMvc.perform(post("/api/auth/mentor/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("meera.kapoor@example.com"))
                .andExpect(jsonPath("$.data.verificationRequired").value(true));

        User mentor = userRepository.findByEmail("meera.kapoor@example.com").orElse(null);
        assertThat(mentor).isNotNull();
        assertThat(mentor.getRole()).isEqualTo(Role.MENTOR);
        assertThat(mentor.getUsername()).isEqualTo("meera.mentor");
        assertThat(mentor.getFullName()).isEqualTo("Dr. Meera Kapoor");
        assertThat(mentor.isEmailVerified()).isFalse();
        assertThat(passwordEncoder.matches("correct-horse-battery", mentor.getPasswordHash())).isTrue();

        assertThat(emailVerificationTokenRepository.findTopByUserIdOrderByCreatedAtDesc(mentor.getId())).isPresent();
    }

    @Test
    @DisplayName("Mentor Registration: Password mismatch returns 400 VALIDATION_FAILED")
    void testMentorRegisterPasswordMismatch() throws Exception {
        String payload = """
                {
                    "fullName": "Dr. Meera Kapoor",
                    "username": "meera.mentor",
                    "email": "meera.kapoor@example.com",
                    "password": "correct-horse-battery",
                    "confirmPassword": "different-password"
                }
                """;

        mockMvc.perform(post("/api/auth/mentor/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.data.fieldErrors[0].field").value("confirmPassword"))
                .andExpect(jsonPath("$.data.fieldErrors[0].message").value("Passwords do not match."));
    }

    @Test
    @DisplayName("Mentor Registration: Duplicate username returns 409 USERNAME_TAKEN")
    void testMentorRegisterDuplicateUsername() throws Exception {
        User existing = User.builder()
                .email("other@example.com")
                .username("meera.mentor")
                .fullName("Existing User")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .build();
        userRepository.save(existing);

        String payload = """
                {
                    "fullName": "Dr. Meera Kapoor",
                    "username": "meera.mentor",
                    "email": "meera.kapoor@example.com",
                    "password": "correct-horse-battery",
                    "confirmPassword": "correct-horse-battery"
                }
                """;

        mockMvc.perform(post("/api/auth/mentor/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("USERNAME_TAKEN"));
    }

    @Test
    @DisplayName("Mentor Registration: Duplicate email returns 409 EMAIL_ALREADY_REGISTERED")
    void testMentorRegisterDuplicateEmail() throws Exception {
        User existing = User.builder()
                .email("meera.kapoor@example.com")
                .username("existing.user")
                .fullName("Existing User")
                .role(Role.MENTOR)
                .status(AccountStatus.ACTIVE)
                .build();
        userRepository.save(existing);

        String payload = """
                {
                    "fullName": "Dr. Meera Kapoor",
                    "username": "different.mentor",
                    "email": "meera.kapoor@example.com",
                    "password": "correct-horse-battery",
                    "confirmPassword": "correct-horse-battery"
                }
                """;

        mockMvc.perform(post("/api/auth/mentor/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("EMAIL_ALREADY_REGISTERED"));
    }

    @Test
    @DisplayName("Mentor Verification & Login Lifecycle: Unverified mentor login gives 403, OTP confirm activates and returns MENTOR role")
    void testMentorVerificationAndLogin() throws Exception {
        // Register mentor
        String registerPayload = """
                {
                    "fullName": "Dr. Meera Kapoor",
                    "username": "meera.mentor",
                    "email": "meera.kapoor@example.com",
                    "password": "correct-horse-battery",
                    "confirmPassword": "correct-horse-battery"
                }
                """;
        mockMvc.perform(post("/api/auth/mentor/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerPayload))
                .andExpect(status().isAccepted());

        // Attempt login before OTP confirm -> 403 EMAIL_NOT_VERIFIED
        String loginPayload = """
                {
                    "email": "meera.kapoor@example.com",
                    "password": "correct-horse-battery"
                }
                """;
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data.code").value("EMAIL_NOT_VERIFIED"));

        // Save a known OTP token for testing confirmation
        User mentor = userRepository.findByEmail("meera.kapoor@example.com").orElseThrow();
        String rawOtp = "654321";
        EmailVerificationToken token = EmailVerificationToken.builder()
                .userId(mentor.getId())
                .tokenHash(com.unix.aiupskilling.authentication.util.TokenHashUtil.sha256(rawOtp))
                .createdAt(java.time.LocalDateTime.now())
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(10))
                .build();
        emailVerificationTokenRepository.save(token);

        // Confirm OTP
        String confirmPayload = String.format("""
                {
                    "email": "meera.kapoor@example.com",
                    "otp": "%s"
                }
                """, rawOtp);

        mockMvc.perform(post("/api/auth/email-verification/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(confirmPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.role").value("MENTOR"))
                .andExpect(jsonPath("$.data.user.username").value("meera.mentor"));

        // Check MentorProfile was automatically provisioned
        assertThat(mentorProfileRepository.findByUserId(mentor.getId())).isPresent();

        // Login now succeeds with role MENTOR
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role").value("MENTOR"));
    }

    @Test
    @DisplayName("Role Access: Student token accessing /api/v1/mentor/** receives 403 Forbidden")
    void testStudentCannotAccessMentorEndpoints() throws Exception {
        User student = User.builder()
                .email("student@example.com")
                .fullName("Regular Student")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        student = userRepository.save(student);

        AuthTokens studentTokens = authTokenService.issueTokens(student, ClientPlatform.WEB);

        mockMvc.perform(get("/api/v1/mentor/profile")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data.code").value("FORBIDDEN"));
    }
}
