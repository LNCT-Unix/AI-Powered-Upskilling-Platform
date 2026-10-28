package com.unix.aiupskilling.assessment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.unix.aiupskilling.assessment.dto.AssessmentDtos;
import com.unix.aiupskilling.assessment.dto.AssessmentDtos.AnswerRequest;
import com.unix.aiupskilling.assessment.dto.AssessmentDtos.StartRequest;
import com.unix.aiupskilling.assessment.model.entity.*;
import com.unix.aiupskilling.assessment.repository.*;
import com.unix.aiupskilling.assessment.service.AssessmentService;
import com.unix.aiupskilling.authentication.dto.response.AuthTokens;
import com.unix.aiupskilling.authentication.model.enums.AccountStatus;
import com.unix.aiupskilling.authentication.model.enums.ClientPlatform;
import com.unix.aiupskilling.authentication.service.AuthTokenService;
import com.unix.aiupskilling.user.User;
import com.unix.aiupskilling.user.Role;
import com.unix.aiupskilling.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class AssessmentEndpointIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthTokenService authTokenService;

    @Autowired
    private TrackRepository trackRepo;

    @Autowired
    private SkillRepository skillRepo;

    @Autowired
    private AssessmentItemRepository itemRepo;

    @Autowired
    private AssessmentRepository assessmentRepo;

    @Autowired
    private AssessmentResponseRepository responseRepo;

    @Autowired
    private AssessmentSkillResultRepository skillResultRepo;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private User testUser;
    private User otherUser;
    private String userToken;
    private String otherToken;

    private Track activeTrack;
    private Track inactiveTrack;
    private Skill skillBasics;
    private Skill skillAdvanced;
    private List<AssessmentItem> poolItems = new ArrayList<>();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // Clean tables in reverse dependency order
        skillResultRepo.deleteAll();
        responseRepo.deleteAll();
        assessmentRepo.deleteAll();
        itemRepo.deleteAll();
        skillRepo.deleteAll();
        trackRepo.deleteAll();
        userRepository.deleteAll();

        // 1. Create users & tokens
        testUser = userRepository.save(User.builder()
                .email("learner@example.com")
                .fullName("Test Learner")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build());

        otherUser = userRepository.save(User.builder()
                .email("other@example.com")
                .fullName("Other Learner")
                .role(Role.USER)
                .status(AccountStatus.ACTIVE)
                .emailVerified(true)
                .build());

        AuthTokens tokens1 = authTokenService.issueTokens(testUser, ClientPlatform.WEB);
        userToken = tokens1.getAccessToken();

        AuthTokens tokens2 = authTokenService.issueTokens(otherUser, ClientPlatform.WEB);
        otherToken = tokens2.getAccessToken();

        // 2. Create tracks with slug and name
        activeTrack = trackRepo.save(new Track(UUID.randomUUID(), "backend-engineering", "Backend Engineering", "ACTIVE"));
        inactiveTrack = trackRepo.save(new Track(UUID.randomUUID(), "frontend-engineering", "Frontend Engineering", "COMING_SOON"));

        // 3. Create skills with slug
        skillBasics = new Skill(UUID.randomUUID(), activeTrack.getId(), "core-fundamentals", "Core Fundamentals", "core", -0.8, Set.of());
        skillBasics = skillRepo.save(skillBasics);

        skillAdvanced = new Skill(UUID.randomUUID(), activeTrack.getId(), "advanced-architecture", "Advanced Architecture", "architecture", 0.6, Set.of(skillBasics.getId()));
        skillAdvanced = skillRepo.save(skillAdvanced);

        // 4. Seed question pool (10 questions with varying difficulties and skill slugs)
        poolItems.clear();
        double[] difficulties = {-0.6, -0.3, 0.0, 0.1, 0.2, 0.35, 0.5, 0.7, 0.85, 1.0};
        for (int i = 0; i < difficulties.length; i++) {
            AssessmentItem item = new AssessmentItem(
                    UUID.randomUUID(),
                    activeTrack.getId(),
                    difficulties[i],
                    "Sample question stem " + (i + 1),
                    "[\"Option A\",\"Option B\",\"Option C\",\"Option D\"]",
                    i % 4, // correct option index 0, 1, 2, or 3
                    "ACTIVE",
                    difficulties[i] < 0.5 ? "core-fundamentals" : "advanced-architecture"
            );
            poolItems.add(itemRepo.save(item));
        }
    }

    @Test
    @DisplayName("GET /api/v1/assessments/tracks lists active tracks for onboarding dropdown")
    void testListTracks() throws Exception {
        mockMvc.perform(get("/api/v1/assessments/tracks")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].slug").value("backend-engineering"))
                .andExpect(jsonPath("$[0].name").value("Backend Engineering"));
    }

    @Test
    @DisplayName("GET /api/v1/assessments/tracks/{trackId}/skills lists skills for pre-selection")
    void testListSkillsForTrack() throws Exception {
        mockMvc.perform(get("/api/v1/assessments/tracks/" + activeTrack.getId() + "/skills")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].slug").value("core-fundamentals"))
                .andExpect(jsonPath("$[0].name").value("Core Fundamentals"))
                .andExpect(jsonPath("$[1].slug").value("advanced-architecture"));
    }

    @Test
    @DisplayName("POST /api/v1/assessments requires authentication (401)")
    void testStartUnauthenticatedReturns401() throws Exception {
        StartRequest request = new StartRequest(activeTrack.getId());
        mockMvc.perform(post("/api/v1/assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/assessments with non-existent track returns 404")
    void testStartNonExistentTrackReturns404() throws Exception {
        StartRequest request = new StartRequest(UUID.randomUUID());
        mockMvc.perform(post("/api/v1/assessments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/v1/assessments with inactive track returns 409 Conflict")
    void testStartInactiveTrackReturns409() throws Exception {
        StartRequest request = new StartRequest(inactiveTrack.getId());
        mockMvc.perform(post("/api/v1/assessments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/v1/assessments successfully starts an assessment with theta=0 and returns first question")
    void testStartSuccessful() throws Exception {
        StartRequest request = new StartRequest(activeTrack.getId(), List.of("core-fundamentals"));
        mockMvc.perform(post("/api/v1/assessments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.assessmentId").isNotEmpty())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.done").value(false))
                .andExpect(jsonPath("$.answered").value(0))
                .andExpect(jsonPath("$.max").value(9))
                .andExpect(jsonPath("$.progress.answered").value(0))
                .andExpect(jsonPath("$.progress.max").value(9))
                .andExpect(jsonPath("$.question.itemId").isNotEmpty())
                .andExpect(jsonPath("$.question.stem").isNotEmpty())
                .andExpect(jsonPath("$.question.options").isArray());
    }

    @Test
    @DisplayName("POST /api/v1/assessments returns existing in-progress assessment if called again")
    void testStartReturnsExistingAssessment() throws Exception {
        StartRequest request = new StartRequest(activeTrack.getId());

        MvcResult firstResult = mockMvc.perform(post("/api/v1/assessments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String firstAssessmentId = objectMapper.readTree(firstResult.getResponse().getContentAsString())
                .get("assessmentId").asText();

        MvcResult secondResult = mockMvc.perform(post("/api/v1/assessments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String secondAssessmentId = objectMapper.readTree(secondResult.getResponse().getContentAsString())
                .get("assessmentId").asText();

        assertThat(secondAssessmentId).isEqualTo(firstAssessmentId);
    }

    @Test
    @DisplayName("GET /api/v1/assessments/{id} returns state and resumes test")
    void testGetState() throws Exception {
        StartRequest request = new StartRequest(activeTrack.getId());
        MvcResult startResult = mockMvc.perform(post("/api/v1/assessments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String assessmentId = objectMapper.readTree(startResult.getResponse().getContentAsString())
                .get("assessmentId").asText();

        mockMvc.perform(get("/api/v1/assessments/" + assessmentId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assessmentId").value(assessmentId))
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.done").value(false))
                .andExpect(jsonPath("$.question").isMap());
    }

    @Test
    @DisplayName("GET /api/v1/assessments/{id} for another user's test returns 404")
    void testGetStateForbiddenForOtherUser() throws Exception {
        StartRequest request = new StartRequest(activeTrack.getId());
        MvcResult startResult = mockMvc.perform(post("/api/v1/assessments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String assessmentId = objectMapper.readTree(startResult.getResponse().getContentAsString())
                .get("assessmentId").asText();

        mockMvc.perform(get("/api/v1/assessments/" + assessmentId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/assessments/{id}/result and /report before completion returns 409 Conflict")
    void testResultBeforeCompletionReturns409() throws Exception {
        StartRequest request = new StartRequest(activeTrack.getId());
        MvcResult startResult = mockMvc.perform(post("/api/v1/assessments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String assessmentId = objectMapper.readTree(startResult.getResponse().getContentAsString())
                .get("assessmentId").asText();

        mockMvc.perform(get("/api/v1/assessments/" + assessmentId + "/result")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/v1/assessments/" + assessmentId + "/report")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/v1/assessments/{id}/responses rejects invalid option and wrong question")
    void testAnswerValidation() throws Exception {
        StartRequest request = new StartRequest(activeTrack.getId());
        MvcResult startResult = mockMvc.perform(post("/api/v1/assessments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        var json = objectMapper.readTree(startResult.getResponse().getContentAsString());
        String assessmentId = json.get("assessmentId").asText();
        String currentItemId = json.get("question").get("itemId").asText();

        // 1. Wrong question item ID -> 409 Conflict
        AnswerRequest wrongItemReq = new AnswerRequest(UUID.randomUUID(), 0);
        mockMvc.perform(post("/api/v1/assessments/" + assessmentId + "/responses")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongItemReq)))
                .andExpect(status().isConflict());

        // 2. Invalid option index (negative or >= options length) -> 400 Bad Request
        AnswerRequest invalidOptionReq = new AnswerRequest(UUID.fromString(currentItemId), 99);
        mockMvc.perform(post("/api/v1/assessments/" + assessmentId + "/responses")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidOptionReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Full test lifecycle: start with known skills, answer adaptively, verify report with question breakdown and unlocked skills")
    void testCompleteAssessmentLifecycleAndReport() throws Exception {
        // 1. Start test with pre-selected comfortable skills
        StartRequest request = new StartRequest(activeTrack.getId(), List.of("core-fundamentals"));
        MvcResult startResult = mockMvc.perform(post("/api/v1/assessments")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        var stateJson = objectMapper.readTree(startResult.getResponse().getContentAsString());
        String assessmentId = stateJson.get("assessmentId").asText();

        // 2. Answer questions in a loop until done
        boolean done = stateJson.get("done").asBoolean();
        int answerCount = 0;

        while (!done && answerCount < 10) {
            String currentItemId = stateJson.get("question").get("itemId").asText();
            AssessmentItem item = itemRepo.findById(UUID.fromString(currentItemId)).orElseThrow();

            // Alternate between correct and incorrect to exercise adaptive difficulty
            int selectedOption = (answerCount % 2 == 0)
                    ? item.getCorrectOption()
                    : (item.getCorrectOption() + 1) % 4;

            AnswerRequest answerReq = new AnswerRequest(UUID.fromString(currentItemId), selectedOption);
            MvcResult answerResult = mockMvc.perform(post("/api/v1/assessments/" + assessmentId + "/responses")
                            .header("Authorization", "Bearer " + userToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(answerReq)))
                    .andExpect(status().isOk())
                    .andReturn();

            stateJson = objectMapper.readTree(answerResult.getResponse().getContentAsString());
            done = stateJson.get("done").asBoolean();
            answerCount++;
        }

        assertThat(done).isTrue();
        assertThat(stateJson.get("status").asText()).isEqualTo("COMPLETED");
        assertThat(stateJson.get("question").isNull()).isTrue();

        // 3. Test submitting another answer when completed -> 409 Conflict
        AnswerRequest extraAnswer = new AnswerRequest(UUID.randomUUID(), 0);
        mockMvc.perform(post("/api/v1/assessments/" + assessmentId + "/responses")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(extraAnswer)))
                .andExpect(status().isConflict());

        // 4. Retrieve final result
        MvcResult resultView = mockMvc.perform(get("/api/v1/assessments/" + assessmentId + "/result")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assessmentId").value(assessmentId))
                .andExpect(jsonPath("$.level").isNotEmpty())
                .andExpect(jsonPath("$.theta").isNumber())
                .andExpect(jsonPath("$.answered").value(answerCount))
                .andExpect(jsonPath("$.correct").isNumber())
                .andExpect(jsonPath("$.skills").isArray())
                .andReturn();

        var resultJson = objectMapper.readTree(resultView.getResponse().getContentAsString());
        assertThat(resultJson.get("skills").size()).isEqualTo(2);

        // 5. Test NEW REPORT API: GET /api/v1/assessments/{id}/report
        MvcResult reportView = mockMvc.perform(get("/api/v1/assessments/" + assessmentId + "/report")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assessmentId").value(assessmentId))
                .andExpect(jsonPath("$.initialTheta").value(0.0))
                .andExpect(jsonPath("$.finalTheta").isNumber())
                .andExpect(jsonPath("$.answered").value(answerCount))
                .andExpect(jsonPath("$.correct").isNumber())
                .andExpect(jsonPath("$.responses").isArray())
                .andExpect(jsonPath("$.responses.length()").value(answerCount))
                .andExpect(jsonPath("$.responses[0].questionStem").isNotEmpty())
                .andExpect(jsonPath("$.responses[0].options").isArray())
                .andExpect(jsonPath("$.responses[0].yourAnswer").isNotEmpty())
                .andExpect(jsonPath("$.responses[0].correctAnswer").isNotEmpty())
                .andExpect(jsonPath("$.responses[0].correct").isBoolean())
                .andExpect(jsonPath("$.skills").isArray())
                .andExpect(jsonPath("$.unlockedSkills").isArray())
                .andReturn();

        var reportJson = objectMapper.readTree(reportView.getResponse().getContentAsString());

        // Pre-declared skill "core-fundamentals" should be MASTERED
        boolean coreMastered = false;
        for (var skillNode : reportJson.get("skills")) {
            if ("core-fundamentals".equals(skillNode.get("slug").asText())) {
                assertThat(skillNode.get("state").asText()).isEqualTo("MASTERED");
                coreMastered = true;
            }
        }
        assertThat(coreMastered).isTrue();

        // unlockedSkills must contain non-LOCKED skills
        for (var unlockedNode : reportJson.get("unlockedSkills")) {
            assertThat(unlockedNode.get("state").asText()).isNotEqualTo("LOCKED");
        }
    }
}
