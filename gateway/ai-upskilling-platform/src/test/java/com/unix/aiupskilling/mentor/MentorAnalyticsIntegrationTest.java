package com.unix.aiupskilling.mentor;

import com.unix.aiupskilling.assessment.controller.AssessmentController;
import com.unix.aiupskilling.assessment.model.entity.Assessment;
import com.unix.aiupskilling.assessment.repository.AssessmentRepository;
import com.unix.aiupskilling.authentication.dto.response.AuthTokens;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import com.unix.aiupskilling.authentication.service.AuthTokenService;
import com.unix.aiupskilling.mentor.model.entity.MentorStudentLink;
import com.unix.aiupskilling.mentor.model.entity.SkillAchievement;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class MentorAnalyticsIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MentorStudentLinkRepository mentorStudentLinkRepository;

    @Autowired
    private SkillAchievementRepository skillAchievementRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private MentorKeyRepository mentorKeyRepository;

    @Autowired
    private MentorProfileRepository mentorProfileRepository;

    @Autowired
    private AuthTokenService authTokenService;

    private MockMvc mockMvc;
    private User mentorA;
    private AuthTokens mentorATokens;
    private User mentorB;
    private AuthTokens mentorBTokens;
    private User student1;
    private User student2;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        cleanup();

        mentorA = User.builder()
                .email("mentor.a@example.com")
                .username("mentor.a")
                .fullName("Mentor A")
                .role(Role.MENTOR)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        mentorA = userRepository.save(mentorA);
        mentorATokens = authTokenService.issueTokens(mentorA, ClientPlatform.WEB);

        mentorB = User.builder()
                .email("mentor.b@example.com")
                .username("mentor.b")
                .fullName("Mentor B")
                .role(Role.MENTOR)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        mentorB = userRepository.save(mentorB);
        mentorBTokens = authTokenService.issueTokens(mentorB, ClientPlatform.WEB);

        student1 = User.builder()
                .email("student1@example.com")
                .username("student1")
                .fullName("Alice Student")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        student1 = userRepository.save(student1);

        student2 = User.builder()
                .email("student2@example.com")
                .username("student2")
                .fullName("Bob Student")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        student2 = userRepository.save(student2);

        mentorStudentLinkRepository.save(MentorStudentLink.builder()
                .mentorUserId(mentorA.getId())
                .studentUserId(student1.getId())
                .linkedAt(Instant.now().minus(10, ChronoUnit.DAYS))
                .build());

        mentorStudentLinkRepository.save(MentorStudentLink.builder()
                .mentorUserId(mentorA.getId())
                .studentUserId(student2.getId())
                .linkedAt(Instant.now().minus(5, ChronoUnit.DAYS))
                .build());

        // Achievements for student1
        skillAchievementRepository.save(SkillAchievement.builder()
                .studentUserId(student1.getId())
                .skillName("Python Programming")
                .skillSlug("python")
                .category("Programming")
                .proficiency("EXPERT")
                .progress(95)
                .verifiedAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .build());

        // Assessments for student1 (1 completed, 1 in progress)
        UUID student1Uuid = AssessmentController.userIdFromLong(student1.getId());
        Assessment asm1 = new Assessment();
        asm1.setUserId(student1Uuid);
        asm1.setTrackId(UUID.randomUUID());
        asm1.setStatus("COMPLETED");
        asm1.setItemsAdministered(10);
        asm1.setCorrectCount(9); // 90%
        asm1.setCompletedAt(Instant.now().minus(1, ChronoUnit.DAYS));
        assessmentRepository.save(asm1);

        Assessment asm2 = new Assessment();
        asm2.setUserId(student1Uuid);
        asm2.setTrackId(UUID.randomUUID());
        asm2.setStatus("IN_PROGRESS");
        asm2.setItemsAdministered(5);
        asm2.setCorrectCount(4);
        assessmentRepository.save(asm2);

        // Assessment for student2 (1 completed)
        UUID student2Uuid = AssessmentController.userIdFromLong(student2.getId());
        Assessment asm3 = new Assessment();
        asm3.setUserId(student2Uuid);
        asm3.setTrackId(UUID.randomUUID());
        asm3.setStatus("COMPLETED");
        asm3.setItemsAdministered(10);
        asm3.setCorrectCount(7); // 70%
        asm3.setCompletedAt(Instant.now().minus(2, ChronoUnit.DAYS));
        assessmentRepository.save(asm3);
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        assessmentRepository.deleteAll();
        skillAchievementRepository.deleteAll();
        mentorStudentLinkRepository.deleteAll();
        mentorKeyRepository.deleteAll();
        mentorProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("GET /api/v1/mentor/analytics/tests returns valid totals, 7-day activity, and progress bands")
    void getTestAnalytics_Success() throws Exception {
        mockMvc.perform(get("/api/v1/mentor/analytics/tests")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Test analytics retrieved"))
                .andExpect(jsonPath("$.data.totals.testsTaken").value(3))
                .andExpect(jsonPath("$.data.totals.completedTests").value(2))
                .andExpect(jsonPath("$.data.totals.inProgressTests").value(1))
                .andExpect(jsonPath("$.data.totals.completionRate").value(67))
                .andExpect(jsonPath("$.data.totals.averageScore").value(80))
                .andExpect(jsonPath("$.data.weeklyActivity", hasSize(7)))
                .andExpect(jsonPath("$.data.progressBands", hasSize(3)))
                .andExpect(jsonPath("$.data.students", hasSize(2)))
                .andExpect(jsonPath("$.data.truncated").value(false));

        // Mentor B has 0 cohort students
        mockMvc.perform(get("/api/v1/mentor/analytics/tests")
                        .header("Authorization", "Bearer " + mentorBTokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totals.testsTaken").value(0))
                .andExpect(jsonPath("$.data.weeklyActivity", hasSize(7)))
                .andExpect(jsonPath("$.data.students", hasSize(0)));
    }

    @Test
    @DisplayName("GET /api/v1/mentor/analytics/tests with invalid date range returns 400 INVALID_DATE_RANGE")
    void getTestAnalytics_InvalidDateRange() throws Exception {
        mockMvc.perform(get("/api/v1/mentor/analytics/tests?from=2026-10-30&to=2026-10-24")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("INVALID_DATE_RANGE"));
    }

    @Test
    @DisplayName("GET /api/v1/mentor/analytics/activity returns recent activity with null score for in-progress tests")
    void getRecentActivity_Success() throws Exception {
        mockMvc.perform(get("/api/v1/mentor/analytics/activity?limit=5")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Recent activity retrieved"))
                .andExpect(jsonPath("$.data", hasSize(3)))
                .andExpect(jsonPath("$.data[?(@.status == 'IN_PROGRESS')].score", contains((Object) null)));

        // Filter by status COMPLETED
        mockMvc.perform(get("/api/v1/mentor/analytics/activity?status=COMPLETED")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].status").value("COMPLETED"))
                .andExpect(jsonPath("$.data[1].status").value("COMPLETED"));

        // Mentor B sees no activity from Mentor A's students
        mockMvc.perform(get("/api/v1/mentor/analytics/activity")
                        .header("Authorization", "Bearer " + mentorBTokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }
}
