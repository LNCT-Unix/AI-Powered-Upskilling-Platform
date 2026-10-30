package com.unix.aiupskilling.mentor;

import com.unix.aiupskilling.assessment.controller.AssessmentController;
import com.unix.aiupskilling.assessment.model.entity.Assessment;
import com.unix.aiupskilling.assessment.repository.AssessmentRepository;
import com.unix.aiupskilling.authentication.dto.response.AuthTokens;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import com.unix.aiupskilling.authentication.service.AuthTokenService;
import com.unix.aiupskilling.mentor.model.entity.MentorKey;
import com.unix.aiupskilling.mentor.model.entity.MentorProfile;
import com.unix.aiupskilling.mentor.model.entity.MentorStudentLink;
import com.unix.aiupskilling.mentor.model.entity.SkillAchievement;
import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class MentorProfileAndOverviewIntegrationTest {

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
    private AuthTokenService authTokenService;

    private MockMvc mockMvc;
    private User mentor;
    private AuthTokens mentorTokens;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        cleanup();

        mentor = User.builder()
                .email("dr.meera@example.com")
                .username("meera.mentor")
                .fullName("Dr. Meera Kapoor")
                .role(Role.MENTOR)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .bio("I help early-career engineers build production skills.")
                .build();
        mentor = userRepository.save(mentor);
        mentorTokens = authTokenService.issueTokens(mentor, ClientPlatform.WEB);

        mentorProfileRepository.save(MentorProfile.builder()
                .userId(mentor.getId())
                .title("Senior Software Engineer & Mentor")
                .location("Bengaluru, India")
                .expertise(List.of("React", "Python", "System Design"))
                .joinedAt(Instant.now())
                .build());

        mentorKeyRepository.save(MentorKey.builder()
                .mentorUserId(mentor.getId())
                .keyValue("MENTOR-7X9K2P")
                .status(MentorKeyStatus.ACTIVE)
                .createdAt(Instant.now())
                .build());
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
    @DisplayName("GET /mentor/profile: Returns profile with title, expertise, location, and active key")
    void testGetMentorProfile() throws Exception {
        mockMvc.perform(get("/api/v1/mentor/profile")
                        .header("Authorization", "Bearer " + mentorTokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Dr. Meera Kapoor"))
                .andExpect(jsonPath("$.data.username").value("meera.mentor"))
                .andExpect(jsonPath("$.data.role").value("MENTOR"))
                .andExpect(jsonPath("$.data.mentorKey").value("MENTOR-7X9K2P"))
                .andExpect(jsonPath("$.data.title").value("Senior Software Engineer & Mentor"))
                .andExpect(jsonPath("$.data.expertise[0]").value("React"))
                .andExpect(jsonPath("$.data.location").value("Bengaluru, India"));
    }

    @Test
    @DisplayName("PATCH /mentor/profile: Updates fields, trims, deduplicates expertise, and rejects duplicate username")
    void testUpdateMentorProfile() throws Exception {
        String updatePayload = """
                {
                    "title": "Principal Engineer & Mentor",
                    "location": "Bengaluru, India (Remote)",
                    "expertise": ["React", "Python", "System Design", "React", "Mentoring"]
                }
                """;

        mockMvc.perform(patch("/api/v1/mentor/profile")
                        .header("Authorization", "Bearer " + mentorTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Principal Engineer & Mentor"))
                .andExpect(jsonPath("$.data.location").value("Bengaluru, India (Remote)"))
                .andExpect(jsonPath("$.data.expertise.length()").value(4)); // deduplicated

        // Username update conflict check
        User otherUser = User.builder()
                .email("other@example.com")
                .username("taken.username")
                .fullName("Other User")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .build();
        userRepository.save(otherUser);

        mockMvc.perform(patch("/api/v1/mentor/profile")
                        .header("Authorization", "Bearer " + mentorTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"taken.username\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.data.code").value("USERNAME_TAKEN"));
    }

    @Test
    @DisplayName("GET /mentor/dashboard/overview: Returns aggregated stats, buckets, top 5 students, and recent 4 achievements")
    void testGetDashboardOverview() throws Exception {
        // Create 2 students
        User student1 = User.builder()
                .email("aarav@example.com")
                .username("aarav.sharma")
                .fullName("Aarav Sharma")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        student1 = userRepository.save(student1);

        User student2 = User.builder()
                .email("priya@example.com")
                .username("priya.nair")
                .fullName("Priya Nair")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        student2 = userRepository.save(student2);

        // Link both to mentor
        mentorStudentLinkRepository.save(MentorStudentLink.builder()
                .mentorUserId(mentor.getId())
                .studentUserId(student1.getId())
                .linkedAt(Instant.now())
                .build());

        mentorStudentLinkRepository.save(MentorStudentLink.builder()
                .mentorUserId(mentor.getId())
                .studentUserId(student2.getId())
                .linkedAt(Instant.now())
                .build());

        // Add achievements
        skillAchievementRepository.save(SkillAchievement.builder()
                .studentUserId(student1.getId())
                .skillSlug("python")
                .skillName("Python Programming")
                .category("Programming")
                .proficiency("EXPERT")
                .progress(95)
                .verifiedAt(Instant.now())
                .build());

        skillAchievementRepository.save(SkillAchievement.builder()
                .studentUserId(student2.getId())
                .skillSlug("react")
                .skillName("React Fundamentals")
                .category("Frontend")
                .proficiency("ADVANCED")
                .progress(80)
                .verifiedAt(Instant.now().minusSeconds(3600))
                .build());

        // Add assessment for student 1
        UUID trackId = UUID.randomUUID();
        Assessment test = new Assessment();
        test.setUserId(AssessmentController.userIdFromLong(student1.getId()));
        test.setTrackId(trackId);
        test.setStatus("COMPLETED");
        test.setItemsAdministered(10);
        test.setCorrectCount(9);
        test.setCompletedAt(Instant.now());
        assessmentRepository.save(test);

        // Query overview
        mockMvc.perform(get("/api/v1/mentor/dashboard/overview")
                        .header("Authorization", "Bearer " + mentorTokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.stats.totalStudents").value(2))
                .andExpect(jsonPath("$.data.stats.testsTaken").value(1))
                .andExpect(jsonPath("$.data.stats.skillsAchieved").value(2))
                .andExpect(jsonPath("$.data.stats.activeStudents").value(2))
                .andExpect(jsonPath("$.data.stats.averageProgress").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.averageScore").value(90))
                .andExpect(jsonPath("$.data.topStudents.length()").value(2))
                .andExpect(jsonPath("$.data.topStudents[0].name").value("Aarav Sharma"))
                .andExpect(jsonPath("$.data.recentAchievements.length()").value(2))
                .andExpect(jsonPath("$.data.recentAchievements[0].skill").value("Python Programming"))
                .andExpect(jsonPath("$.data.mentorKey").value("MENTOR-7X9K2P"));
    }
}

