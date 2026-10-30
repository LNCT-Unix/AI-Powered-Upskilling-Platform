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
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class MentorStudentsAndAchievementsIntegrationTest {

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
                .email("aarav@example.com")
                .username("aarav.sharma")
                .fullName("Aarav Sharma")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        student1 = userRepository.save(student1);

        student2 = User.builder()
                .email("rahul@example.com")
                .username("rahul.gupta")
                .fullName("Rahul Gupta")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        student2 = userRepository.save(student2);

        // Link student 1 & student 2 to Mentor A only
        mentorStudentLinkRepository.save(MentorStudentLink.builder()
                .mentorUserId(mentorA.getId())
                .studentUserId(student1.getId())
                .linkedAt(Instant.now())
                .build());

        mentorStudentLinkRepository.save(MentorStudentLink.builder()
                .mentorUserId(mentorA.getId())
                .studentUserId(student2.getId())
                .linkedAt(Instant.now())
                .build());

        // Add achievements for Student 1 (Progress = 90 -> Advanced)
        skillAchievementRepository.save(SkillAchievement.builder()
                .studentUserId(student1.getId())
                .skillSlug("python")
                .skillName("Python Programming")
                .category("Programming")
                .proficiency("EXPERT")
                .progress(90)
                .verifiedAt(Instant.now())
                .build());

        // Add achievements for Student 2 (Progress = 40 -> Needs Attention)
        skillAchievementRepository.save(SkillAchievement.builder()
                .studentUserId(student2.getId())
                .skillSlug("sql")
                .skillName("SQL Fundamentals")
                .category("Databases")
                .proficiency("BEGINNER")
                .progress(40)
                .verifiedAt(Instant.now())
                .build());

        // Add completed assessment for Student 1
        Assessment test = new Assessment();
        test.setUserId(AssessmentController.userIdFromLong(student1.getId()));
        test.setTrackId(UUID.randomUUID());
        test.setStatus("COMPLETED");
        test.setItemsAdministered(10);
        test.setCorrectCount(9);
        test.setCompletedAt(Instant.now());
        assessmentRepository.save(test);
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
    @DisplayName("GET /mentor/students: Returns paged list, filters by q and progressBand, and computes progressLabel")
    void testGetStudents() throws Exception {
        // Query all students for Mentor A
        mockMvc.perform(get("/api/v1/mentor/students")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.content[0].name").value("Aarav Sharma"))
                .andExpect(jsonPath("$.data.content[0].progressLabel").value("Advanced"))
                .andExpect(jsonPath("$.data.content[1].name").value("Rahul Gupta"))
                .andExpect(jsonPath("$.data.content[1].progressLabel").value("Needs Attention"));

        // Filter by q = aarav
        mockMvc.perform(get("/api/v1/mentor/students?q=aarav")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Aarav Sharma"));

        // Filter by progressBand = NEEDS_ATTENTION
        mockMvc.perform(get("/api/v1/mentor/students?progressBand=NEEDS_ATTENTION")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Rahul Gupta"));

        // Invalid progressBand returns 400
        mockMvc.perform(get("/api/v1/mentor/students?progressBand=UNKNOWN")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.code").value("INVALID_PROGRESS_BAND"));

        // Invalid sort returns 400
        mockMvc.perform(get("/api/v1/mentor/students?sort=invalid_sort")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.code").value("INVALID_SORT"));
    }

    @Test
    @DisplayName("GET /mentor/students/{id}: Returns student detail with achievements and tests, or 404 if not linked")
    void testGetStudentDetailAndCohortIsolation() throws Exception {
        // Mentor A accesses Student 1 -> 200 OK
        mockMvc.perform(get("/api/v1/mentor/students/" + student1.getId())
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.student.name").value("Aarav Sharma"))
                .andExpect(jsonPath("$.data.achievements[0].skill").value("Python Programming"))
                .andExpect(jsonPath("$.data.testHistory[0].score").value(90));

        // Mentor B accesses Student 1 (not linked) -> 404 STUDENT_NOT_FOUND (cohort isolation)
        mockMvc.perform(get("/api/v1/mentor/students/" + student1.getId())
                        .header("Authorization", "Bearer " + mentorBTokens.getAccessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.data.code").value("STUDENT_NOT_FOUND"));
    }

    @Test
    @DisplayName("GET /mentor/achievements: Returns paged achievements, filtered by category/proficiency/q, and facets")
    void testGetAchievementsAndFacets() throws Exception {
        // Mentor A queries achievements
        mockMvc.perform(get("/api/v1/mentor/achievements")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2));

        // Filter by category = Databases
        mockMvc.perform(get("/api/v1/mentor/achievements?category=Databases")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].skill").value("SQL Fundamentals"));

        // Filter by proficiency = EXPERT
        mockMvc.perform(get("/api/v1/mentor/achievements?proficiency=EXPERT")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].skill").value("Python Programming"));

        // Query facets
        mockMvc.perform(get("/api/v1/mentor/achievements/facets")
                        .header("Authorization", "Bearer " + mentorATokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.summary.totalAchievements").value(2))
                .andExpect(jsonPath("$.data.summary.uniqueSkills").value(2))
                .andExpect(jsonPath("$.data.summary.topLevelCount").value(1)) // 1 EXPERT
                .andExpect(jsonPath("$.data.categories.length()").value(6));
    }
}
