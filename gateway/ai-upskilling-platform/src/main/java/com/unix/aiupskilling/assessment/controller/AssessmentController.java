package com.unix.aiupskilling.assessment.controller;

import com.unix.aiupskilling.assessment.dto.AssessmentDtos.*;
import com.unix.aiupskilling.assessment.service.AssessmentService;
import com.unix.aiupskilling.user.User;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Assessment endpoints.
 *
 * <h2>Onboarding</h2>
 *   GET  /api/v1/assessments/tracks                       list available tracks (for dropdown)
 *   GET  /api/v1/assessments/tracks/{trackId}/skills      list all skills (for pre-selection)
 *
 * <h2>Test lifecycle</h2>
 *   POST /api/v1/assessments                              start (or resume); body: {trackId, knownSkillSlugs}
 *   GET  /api/v1/assessments/{id}                         current state: next question or done
 *   POST /api/v1/assessments/{id}/responses               submit an answer, get the next question back
 *   GET  /api/v1/assessments/{id}/result                  final result once COMPLETED
 *   GET  /api/v1/assessments/{id}/report                  detailed report: per-question breakdown + graph
 */
@RestController
@RequestMapping("/api/v1/assessments")
public class AssessmentController {

    private final AssessmentService service;

    public AssessmentController(AssessmentService service) {
        this.service = service;
    }

    // ---------- onboarding ----------

    /** Lists all ACTIVE tracks for the onboarding track-picker dropdown. */
    @GetMapping("/tracks")
    public List<TrackSummary> listTracks() {
        return service.listTracks();
    }

    /**
     * Lists all skills for a track for the onboarding pre-selection screen.
     * The learner uses this to mark which skills they already know.
     */
    @GetMapping("/tracks/{trackId}/skills")
    public List<SkillSummary> listSkillsForTrack(@PathVariable UUID trackId) {
        return service.listSkillsForTrack(trackId);
    }

    // ---------- test lifecycle ----------

    /**
     * Starts a new assessment (or resumes the one already in progress).
     * Body: { "trackId": "...", "knownSkillSlugs": ["sql-basics", "http-basics", ...] }
     * knownSkillSlugs may be empty. They are used to compute a higher starting theta so
     * the test skips skills the learner already declared proficiency in.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssessmentState start(Authentication auth, @Valid @RequestBody StartRequest request) {
        return service.start(userId(auth), request.getTrackId(), request.getKnownSkillSlugs());
    }

    /** Lists all previously taken assessments for the authenticated user, latest first. */
    @GetMapping("/history")
    public List<AssessmentHistoryItem> history(Authentication auth) {
        return service.getHistory(userId(auth));
    }

    /** Returns the current state of an assessment: the next question, or done=true when finished. */
    @GetMapping("/{id}")
    public AssessmentState state(Authentication auth, @PathVariable UUID id) {
        return service.state(userId(auth), id);
    }

    /**
     * Submits the learner's answer to the current question and returns the next state.
     * Body: { "itemId": "...", "selectedOption": 2 }
     */
    @PostMapping("/{id}/responses")
    public AssessmentState answer(Authentication auth, @PathVariable UUID id,
                                  @Valid @RequestBody AnswerRequest request) {
        return service.answer(userId(auth), id, request.getItemId(), request.getSelectedOption());
    }

    /** Returns a summary of the final result. Only available once the assessment is COMPLETED. */
    @GetMapping("/{id}/result")
    public ResultView result(Authentication auth, @PathVariable UUID id) {
        return service.result(userId(auth), id);
    }

    /**
     * Returns the full post-assessment report.
     * Includes a per-question breakdown (question, user's answer, correct answer, skill tested)
     * and the full skill graph state showing MASTERED / FRONTIER / LOCKED for every skill.
     * The unlockedSkills list contains every skill that is MASTERED or FRONTIER — the frontend
     * uses this to update/highlight the graph nodes.
     * Only available once the assessment is COMPLETED.
     */
    @GetMapping("/{id}/report")
    public AssessmentReport report(Authentication auth, @PathVariable UUID id) {
        return service.report(userId(auth), id);
    }

    // ---------- 5-question node unlock quiz ----------

    /**
     * Serves 5 questions all together directly to test competency for a specific node on the graph.
     * Withholds the correct answers from the response payload.
     */
    @GetMapping("/skills/{skillSlug}/quiz")
    public SkillQuizResponse getSkillQuiz(@PathVariable String skillSlug) {
        return service.getQuizForSkill(skillSlug);
    }

    /**
     * Evaluates the 5 submitted answers for a skill quiz.
     * If the user answers at least 3/5 correctly, marks the node as ready to learn and unlocks it.
     */
    @PostMapping("/skills/{skillSlug}/quiz/submit")
    public SkillQuizResult submitSkillQuiz(Authentication auth,
                                           @PathVariable String skillSlug,
                                           @Valid @RequestBody SkillQuizSubmission submission) {
        return service.submitQuizForSkill(userId(auth), skillSlug, submission);
    }

    // ---------- auth helper ----------

    /**
     * Resolves user ID as UUID:
     * - If auth principal is the User entity, converts user.getId() (Long) to UUID.
     * - If auth name is a UUID string, parses directly.
     * - If auth name is a numeric string (Long), converts to UUID.
     * - Otherwise derives a deterministic UUID from the name bytes.
     */
    public static UUID userId(Authentication auth) {
        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) {
            return userIdFromLong(user.getId());
        }
        String name = auth.getName();
        if (name != null && !name.isBlank()) {
            try {
                return UUID.fromString(name);
            } catch (IllegalArgumentException ignored) {
                try {
                    long numericId = Long.parseLong(name);
                    return userIdFromLong(numericId);
                } catch (NumberFormatException e) {
                    return UUID.nameUUIDFromBytes(name.getBytes(StandardCharsets.UTF_8));
                }
            }
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid authentication principal");
    }

    public static UUID userIdFromLong(Long id) {
        return new UUID(0L, id != null ? id : 0L);
    }
}
