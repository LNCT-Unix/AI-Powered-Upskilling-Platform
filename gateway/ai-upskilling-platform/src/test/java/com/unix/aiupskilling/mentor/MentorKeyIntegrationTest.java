package com.unix.aiupskilling.mentor;

import com.unix.aiupskilling.authentication.dto.response.AuthTokens;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import com.unix.aiupskilling.authentication.service.AuthTokenService;
import com.unix.aiupskilling.mentor.model.entity.MentorKey;
import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
import com.unix.aiupskilling.mentor.repository.MentorKeyRepository;
import com.unix.aiupskilling.mentor.repository.MentorProfileRepository;
import com.unix.aiupskilling.mentor.repository.MentorStudentLinkRepository;
import com.unix.aiupskilling.mentor.util.MentorKeyGenerator;
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

import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class MentorKeyIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MentorKeyRepository mentorKeyRepository;

    @Autowired
    private MentorStudentLinkRepository mentorStudentLinkRepository;

    @Autowired
    private MentorProfileRepository mentorProfileRepository;

    @Autowired
    private AuthTokenService authTokenService;

    private MockMvc mockMvc;
    private User testMentor;
    private AuthTokens mentorTokens;
    private User testStudent;
    private AuthTokens studentTokens;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        cleanup();

        testMentor = User.builder()
                .email("dr.meera@example.com")
                .username("meera.mentor")
                .fullName("Dr. Meera Kapoor")
                .role(Role.MENTOR)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        testMentor = userRepository.save(testMentor);
        mentorTokens = authTokenService.issueTokens(testMentor, ClientPlatform.WEB);

        testStudent = User.builder()
                .email("aarav@example.com")
                .username("aarav.sharma")
                .fullName("Aarav Sharma")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        testStudent = userRepository.save(testStudent);
        studentTokens = authTokenService.issueTokens(testStudent, ClientPlatform.WEB);
    }

    @AfterEach
    void tearDown() {
        cleanup();
    }

    private void cleanup() {
        mentorStudentLinkRepository.deleteAll();
        mentorKeyRepository.deleteAll();
        mentorProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Key Generator: Key format matches regex and 100 generated keys are valid")
    void testKeyFormat() {
        Pattern pattern = Pattern.compile("^MENTOR-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$");
        for (int i = 0; i < 100; i++) {
            String key = MentorKeyGenerator.generateKey();
            assertThat(pattern.matcher(key).matches()).isTrue();
            assertThat(MentorKeyGenerator.isValidFormat(key)).isTrue();
        }
    }

    @Test
    @DisplayName("GET /key: When no key exists, returns 200 OK with data: null")
    void testGetKeyWhenNoneExists() throws Exception {
        mockMvc.perform(get("/api/v1/mentor/key")
                        .header("Authorization", "Bearer " + mentorTokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    @DisplayName("POST /key: Generate initial key returns 201 Created")
    void testGenerateInitialKey() throws Exception {
        String payload = """
                {
                    "replaceExisting": false
                }
                """;

        mockMvc.perform(post("/api/v1/mentor/key")
                        .header("Authorization", "Bearer " + mentorTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.key").isNotEmpty())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.linkedStudentCount").value(0));
    }

    @Test
    @DisplayName("POST /key: With active key and replaceExisting=false returns 409 KEY_ALREADY_EXISTS")
    void testConflictWhenKeyAlreadyExists() throws Exception {
        // Generate initial key
        mockMvc.perform(post("/api/v1/mentor/key")
                        .header("Authorization", "Bearer " + mentorTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"replaceExisting\": false}"))
                .andExpect(status().isCreated());

        // Second request with replaceExisting=false -> 409
        mockMvc.perform(post("/api/v1/mentor/key")
                        .header("Authorization", "Bearer " + mentorTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"replaceExisting\": false}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.code").value("KEY_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.data.existingKey").isNotEmpty());
    }

    @Test
    @DisplayName("POST /key: With replaceExisting=true rotates key, revokes old one atomically")
    void testRotateKey() throws Exception {
        // Generate initial key
        mockMvc.perform(post("/api/v1/mentor/key")
                        .header("Authorization", "Bearer " + mentorTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"replaceExisting\": false}"))
                .andExpect(status().isCreated());

        MentorKey oldKey = mentorKeyRepository.findByMentorUserIdAndStatus(testMentor.getId(), MentorKeyStatus.ACTIVE).orElseThrow();

        // Rotate
        mockMvc.perform(post("/api/v1/mentor/key")
                        .header("Authorization", "Bearer " + mentorTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"replaceExisting\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.rotatedAt").isNotEmpty());

        // Verify old key is revoked
        MentorKey refreshedOldKey = mentorKeyRepository.findById(oldKey.getId()).orElseThrow();
        assertThat(refreshedOldKey.getStatus()).isEqualTo(MentorKeyStatus.REVOKED);
        assertThat(refreshedOldKey.getRevokedAt()).isNotNull();
    }

    @Test
    @DisplayName("POST /students/mentor-link: Student successfully links with valid mentor key")
    void testStudentLinksSuccessfully() throws Exception {
        // Mentor generates key
        mentorKeyRepository.save(MentorKey.builder()
                .mentorUserId(testMentor.getId())
                .keyValue("MENTOR-7X9K2P")
                .status(MentorKeyStatus.ACTIVE)
                .createdAt(java.time.Instant.now())
                .build());

        // Student links
        String payload = """
                {
                    "key": "MENTOR-7X9K2P"
                }
                """;

        mockMvc.perform(post("/api/v1/students/mentor-link")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.mentorName").value("Dr. Meera Kapoor"))
                .andExpect(jsonPath("$.data.alreadyLinked").value(false));

        // Calling same endpoint again -> Idempotent 200 OK with alreadyLinked=true
        mockMvc.perform(post("/api/v1/students/mentor-link")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.alreadyLinked").value(true));

        // Check GET /key now reflects linked student count
        mockMvc.perform(get("/api/v1/mentor/key")
                        .header("Authorization", "Bearer " + mentorTokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.linkedStudentCount").value(1));
    }

    @Test
    @DisplayName("POST /students/mentor-link: Revoked or invalid key returns 404 INVALID_MENTOR_KEY")
    void testStudentLinkWithInvalidKey() throws Exception {
        // Non-existent key
        mockMvc.perform(post("/api/v1/students/mentor-link")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"key\": \"MENTOR-999999\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.data.code").value("INVALID_MENTOR_KEY"));

        // Revoked key
        mentorKeyRepository.save(MentorKey.builder()
                .mentorUserId(testMentor.getId())
                .keyValue("MENTOR-REVOKD")
                .status(MentorKeyStatus.REVOKED)
                .createdAt(java.time.Instant.now())
                .build());

        mockMvc.perform(post("/api/v1/students/mentor-link")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"key\": \"MENTOR-REVOKD\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.data.code").value("INVALID_MENTOR_KEY"));
    }

    @Test
    @DisplayName("POST /students/mentor-link: Student already linked to Mentor A attempting to link to Mentor B returns 409 ALREADY_LINKED")
    void testStudentAlreadyLinkedConflict() throws Exception {
        // Link student to Mentor A
        mentorStudentLinkRepository.save(com.unix.aiupskilling.mentor.model.entity.MentorStudentLink.builder()
                .mentorUserId(testMentor.getId())
                .studentUserId(testStudent.getId())
                .linkedAt(java.time.Instant.now())
                .build());

        // Create Mentor B with active key
        User mentorB = User.builder()
                .email("mentor.b@example.com")
                .username("mentor.b")
                .fullName("Mentor B")
                .role(Role.MENTOR)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build();
        mentorB = userRepository.save(mentorB);

        mentorKeyRepository.save(MentorKey.builder()
                .mentorUserId(mentorB.getId())
                .keyValue("MENTOR-BBBBBB")
                .status(MentorKeyStatus.ACTIVE)
                .createdAt(java.time.Instant.now())
                .build());

        // Attempt link to Mentor B
        mockMvc.perform(post("/api/v1/students/mentor-link")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"key\": \"MENTOR-BBBBBB\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.data.code").value("ALREADY_LINKED"))
                .andExpect(jsonPath("$.data.mentorName").value("Dr. Meera Kapoor"));
    }

    @Test
    @DisplayName("GET and DELETE /students/mentor-link: Query current link and unlink")
    void testGetAndUnlinkStudentMentor() throws Exception {
        // Initially no mentor linked
        mockMvc.perform(get("/api/v1/students/mentor-link")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").doesNotExist());

        // Link student to Mentor
        mentorStudentLinkRepository.save(com.unix.aiupskilling.mentor.model.entity.MentorStudentLink.builder()
                .mentorUserId(testMentor.getId())
                .studentUserId(testStudent.getId())
                .linkedAt(java.time.Instant.now())
                .build());

        // Now returns active mentor
        mockMvc.perform(get("/api/v1/students/mentor-link")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mentorName").value("Dr. Meera Kapoor"))
                .andExpect(jsonPath("$.data.alreadyLinked").value(true));

        // Unlink
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/students/mentor-link")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // After unlinking, returns null
        mockMvc.perform(get("/api/v1/students/mentor-link")
                        .header("Authorization", "Bearer " + studentTokens.getAccessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());
    }
}

