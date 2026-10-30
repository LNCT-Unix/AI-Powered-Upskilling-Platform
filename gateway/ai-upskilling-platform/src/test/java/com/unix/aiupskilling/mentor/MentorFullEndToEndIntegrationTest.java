package com.unix.aiupskilling.mentor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.unix.aiupskilling.assessment.controller.AssessmentController;
import com.unix.aiupskilling.assessment.model.entity.Assessment;
import com.unix.aiupskilling.assessment.repository.AssessmentRepository;
import com.unix.aiupskilling.authentication.dto.request.LoginRequest;
import com.unix.aiupskilling.authentication.dto.request.MentorRegisterRequest;
import com.unix.aiupskilling.authentication.dto.response.AuthTokens;
import com.unix.aiupskilling.authentication.model.entity.EmailVerificationToken;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import com.unix.aiupskilling.authentication.repository.EmailVerificationTokenRepository;
import com.unix.aiupskilling.authentication.service.AuthTokenService;
import com.unix.aiupskilling.mentor.dto.UpdateMentorProfileRequest;
import com.unix.aiupskilling.mentor.model.entity.MentorKey;
import com.unix.aiupskilling.mentor.model.entity.MentorProfile;
import com.unix.aiupskilling.mentor.model.entity.MentorStudentLink;
import com.unix.aiupskilling.mentor.model.entity.SkillAchievement;
import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
import com.unix.aiupskilling.mentor.model.enums.ProficiencyLevel;
import com.unix.aiupskilling.mentor.repository.MentorKeyRepository;
import com.unix.aiupskilling.mentor.repository.MentorProfileRepository;
import com.unix.aiupskilling.mentor.repository.MentorStudentLinkRepository;
import com.unix.aiupskilling.mentor.repository.SkillAchievementRepository;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class MentorFullEndToEndIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MentorProfileRepository mentorProfileRepository;

    @Autowired
    private MentorKeyRepository mentorKeyRepository;

    @Autowired
    private MentorStudentLinkRepository mentorStudentLinkRepository;

    @Autowired
    private SkillAchievementRepository skillAchievementRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    @Autowired
    private AuthTokenService authTokenService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

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
        assessmentRepository.deleteAll();
        skillAchievementRepository.deleteAll();
        mentorStudentLinkRepository.deleteAll();
        mentorKeyRepository.deleteAll();
        mentorProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Complete Mentor Workflow: Register -> Verify OTP -> Login -> Profile -> Keys -> Linking -> Overview -> Students -> Achievements -> Analytics -> Security")
    void testFullMentorFrontendToBackendFlow() throws Exception {
        // =========================================================================
        // 1. MENTOR REGISTRATION (MentorRegistrationForm.jsx -> POST /api/auth/mentor/register)
        // =========================================================================
        MentorRegisterRequest registerReq = new MentorRegisterRequest();
        registerReq.setFullName("Dr. Meera Kapoor");
        registerReq.setUsername("meera.mentor");
        registerReq.setEmail("meera.kapoor@example.com");
        registerReq.setPassword("Password123!");
        registerReq.setConfirmPassword("Password123!");

        mockMvc.perform(post("/api/auth/mentor/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("meera.kapoor@example.com"))
                .andExpect(jsonPath("$.data.verificationRequired").value(true));

        // Duplicate username check
        MentorRegisterRequest duplicateUsernameReq = new MentorRegisterRequest();
        duplicateUsernameReq.setFullName("Another Mentor");
        duplicateUsernameReq.setUsername("meera.mentor");
        duplicateUsernameReq.setEmail("another@example.com");
        duplicateUsernameReq.setPassword("Password123!");
        duplicateUsernameReq.setConfirmPassword("Password123!");

        mockMvc.perform(post("/api/auth/mentor/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateUsernameReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("USERNAME_TAKEN"));

        // =========================================================================
        // 2. EMAIL VERIFICATION OTP (AuthView.jsx -> POST /api/auth/email-verification/confirm)
        // =========================================================================
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

        // Confirm email with OTP
        String confirmJson = """
                {
                  "email": "meera.kapoor@example.com",
                  "otp": "%s"
                }
                """.formatted(rawOtp);

        MvcResult confirmResult = mockMvc.perform(post("/api/auth/email-verification/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(confirmJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.role").value("MENTOR"))
                .andExpect(jsonPath("$.data.user.username").value("meera.mentor"))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andReturn();

        JsonNode confirmNode = objectMapper.readTree(confirmResult.getResponse().getContentAsString());
        String mentorAccessToken = confirmNode.get("data").get("accessToken").asText();

        // Verify MentorProfile was automatically provisioned
        User mentorUser = userRepository.findByEmail("meera.kapoor@example.com").orElseThrow();
        assertTrue(mentorProfileRepository.existsById(mentorUser.getId()));

        // =========================================================================
        // 3. MENTOR LOGIN & /api/auth/me (AuthView.jsx / AuthContext.jsx)
        // =========================================================================
        LoginRequest loginReq = new LoginRequest();
        loginReq.setEmail("meera.kapoor@example.com");
        loginReq.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role").value("MENTOR"))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + mentorAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("MENTOR"))
                .andExpect(jsonPath("$.data.username").value("meera.mentor"));

        // =========================================================================
        // 4. MENTOR PROFILE GET & PATCH (MentorProfile.jsx)
        // =========================================================================
        mockMvc.perform(get("/api/v1/mentor/profile")
                        .header("Authorization", "Bearer " + mentorAccessToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.data.fullName").value("Dr. Meera Kapoor"))
                .andExpect(jsonPath("$.data.username").value("meera.mentor"));

        UpdateMentorProfileRequest updateProfileReq = new UpdateMentorProfileRequest();
        updateProfileReq.setTitle("Senior Lead Engineer");
        updateProfileReq.setLocation("Bengaluru, India");
        updateProfileReq.setBio("Helping junior devs grow.");
        updateProfileReq.setExpertise(List.of("Java", "Spring Boot", "React", "System Design"));

        mockMvc.perform(patch("/api/v1/mentor/profile")
                        .header("Authorization", "Bearer " + mentorAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateProfileReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Senior Lead Engineer"))
                .andExpect(jsonPath("$.data.expertise", hasItems("Java", "Spring Boot", "React", "System Design")));

        // =========================================================================
        // 5. MENTOR KEY GENERATION & ROTATION (MentorUniqueKey.jsx)
        // =========================================================================
        // Initially no key exists
        mockMvc.perform(get("/api/v1/mentor/key")
                        .header("Authorization", "Bearer " + mentorAccessToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.data").value(nullValue()));

        // Create first key: POST /api/v1/mentor/key
        String createKeyJson = """
                {
                  "replaceExisting": false
                }
                """;

        MvcResult keyCreateResult = mockMvc.perform(post("/api/v1/mentor/key")
                        .header("Authorization", "Bearer " + mentorAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createKeyJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.key", matchesPattern("^MENTOR-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$")))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andReturn();

        JsonNode keyNode = objectMapper.readTree(keyCreateResult.getResponse().getContentAsString());
        String initialKey = keyNode.get("data").get("key").asText();

        // Conflict when creating key again without replaceExisting
        mockMvc.perform(post("/api/v1/mentor/key")
                        .header("Authorization", "Bearer " + mentorAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createKeyJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.data.code").value("KEY_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.data.existingKey").value(initialKey));

        // Rotate key: POST /api/v1/mentor/key with replaceExisting=true
        String rotateKeyJson = """
                {
                  "replaceExisting": true
                }
                """;

        MvcResult rotateKeyResult = mockMvc.perform(post("/api/v1/mentor/key")
                        .header("Authorization", "Bearer " + mentorAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rotateKeyJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.key", not(equalTo(initialKey))))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andReturn();

        String rotatedKey = objectMapper.readTree(rotateKeyResult.getResponse().getContentAsString()).get("data").get("key").asText();

        // =========================================================================
        // 6. STUDENT LINKING (Student redeeming key -> POST /api/v1/students/mentor-link)
        // =========================================================================
        User studentUser = User.builder()
                .email("student.aarav@example.com")
                .username("aarav.sharma")
                .fullName("Aarav Sharma")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        studentUser = userRepository.save(studentUser);
        AuthTokens studentTokens = authTokenService.issueTokens(studentUser, ClientPlatform.WEB);

        // Revoked key returns 404 INVALID_MENTOR_KEY
        String linkOldKeyJson = """
                { "key": "%s" }
                """.formatted(initialKey);
        mockMvc.perform(post("/api/v1/students/mentor-link")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(linkOldKeyJson))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.data.code").value("INVALID_MENTOR_KEY"));

        // Valid rotated key links student
        String linkNewKeyJson = """
                { "key": "%s" }
                """.formatted(rotatedKey);
        mockMvc.perform(post("/api/v1/students/mentor-link")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(linkNewKeyJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mentorName").value("Dr. Meera Kapoor"))
                .andExpect(jsonPath("$.data.alreadyLinked").value(false));

        // Idempotent link again
        mockMvc.perform(post("/api/v1/students/mentor-link")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(linkNewKeyJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.alreadyLinked").value(true));

        // Setup student achievement & assessments
        skillAchievementRepository.save(SkillAchievement.builder()
                .studentUserId(studentUser.getId())
                .skillName("Python Programming")
                .skillSlug("python")
                .category("Programming")
                .proficiency("EXPERT")
                .progress(95)
                .verifiedAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .build());

        UUID studentUuid = AssessmentController.userIdFromLong(studentUser.getId());
        Assessment asm = new Assessment();
        asm.setUserId(studentUuid);
        asm.setTrackId(UUID.randomUUID());
        asm.setStatus("COMPLETED");
        asm.setItemsAdministered(10);
        asm.setCorrectCount(9); // 90%
        asm.setCompletedAt(Instant.now().minus(1, ChronoUnit.DAYS));
        assessmentRepository.save(asm);

        // =========================================================================
        // 7. COHORT OVERVIEW (MentorOverview.jsx -> GET /api/v1/mentor/dashboard/overview)
        // =========================================================================
        mockMvc.perform(get("/api/v1/mentor/dashboard/overview")
                        .header("Authorization", "Bearer " + mentorAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.totalStudents").value(1))
                .andExpect(jsonPath("$.data.stats.testsTaken").value(1))
                .andExpect(jsonPath("$.data.stats.skillsAchieved").value(1))
                .andExpect(jsonPath("$.data.stats.activeStudents").value(1))
                .andExpect(jsonPath("$.data.progressBuckets", hasSize(3)))
                .andExpect(jsonPath("$.data.topStudents", hasSize(1)))
                .andExpect(jsonPath("$.data.recentAchievements", hasSize(1)));

        // =========================================================================
        // 8. STUDENT DIRECTORY & DETAIL MODAL (MyStudents.jsx -> GET /students, GET /students/{id})
        // =========================================================================
        mockMvc.perform(get("/api/v1/mentor/students?q=aarav&progressBand=ADVANCED&sort=progress_desc")
                        .header("Authorization", "Bearer " + mentorAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name").value("Aarav Sharma"))
                .andExpect(jsonPath("$.data.content[0].progressBand").value("ADVANCED"));

        mockMvc.perform(get("/api/v1/mentor/students/" + studentUser.getId())
                        .header("Authorization", "Bearer " + mentorAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.student.name").value("Aarav Sharma"))
                .andExpect(jsonPath("$.data.achievements", hasSize(1)))
                .andExpect(jsonPath("$.data.testHistory", hasSize(1)));

        // =========================================================================
        // 9. ACHIEVED SKILLS & FACETS (AchievedSkills.jsx -> GET /achievements, /facets)
        // =========================================================================
        mockMvc.perform(get("/api/v1/mentor/achievements/facets")
                        .header("Authorization", "Bearer " + mentorAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.categories", hasItems("Programming", "Data Structures", "Frontend", "Databases", "AI & ML", "Problem Solving")))
                .andExpect(jsonPath("$.data.summary.totalAchievements").value(1));

        mockMvc.perform(get("/api/v1/mentor/achievements?category=Programming")
                        .header("Authorization", "Bearer " + mentorAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].skill").value("Python Programming"));

        // =========================================================================
        // 10. TEST ANALYTICS & ACTIVITY FEED (TestAnalytics.jsx -> GET /analytics/tests, /activity)
        // =========================================================================
        mockMvc.perform(get("/api/v1/mentor/analytics/tests")
                        .header("Authorization", "Bearer " + mentorAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totals.testsTaken").value(1))
                .andExpect(jsonPath("$.data.totals.completedTests").value(1))
                .andExpect(jsonPath("$.data.weeklyActivity", hasSize(7)))
                .andExpect(jsonPath("$.data.students", hasSize(1)));

        mockMvc.perform(get("/api/v1/mentor/analytics/activity?limit=5")
                        .header("Authorization", "Bearer " + mentorAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].studentName").value("Aarav Sharma"))
                .andExpect(jsonPath("$.data[0].score").value(90));

        // =========================================================================
        // 11. SECURITY & AUTHORIZATION BOUNDARIES
        // =========================================================================
        // Student token attempting mentor endpoints -> 403 Forbidden
        mockMvc.perform(get("/api/v1/mentor/dashboard/overview")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken()))
                .andExpect(status().isForbidden());

        // Anonymous request -> 401 Unauthorized
        mockMvc.perform(get("/api/v1/mentor/profile"))
                .andExpect(status().isUnauthorized());

        // Unknown / unlinked student detail -> 404
        mockMvc.perform(get("/api/v1/mentor/students/999999")
                        .header("Authorization", "Bearer " + mentorAccessToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.data.code").value("STUDENT_NOT_FOUND"));
    }
}
