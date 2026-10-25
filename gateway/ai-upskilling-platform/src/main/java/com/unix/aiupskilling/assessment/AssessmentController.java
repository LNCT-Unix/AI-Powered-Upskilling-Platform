package com.unix.aiupskilling.assessment;

import com.unix.aiupskilling.assessment.AssessmentDtos.*;
import com.unix.aiupskilling.user.User;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
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
 * The four assessment endpoints.
 *
 *   POST  /api/v1/assessments                 start (or resume the one already in progress)
 *   GET   /api/v1/assessments/{id}            current state: the next question, or done
 *   POST  /api/v1/assessments/{id}/responses  submit an answer, get the next question back
 *   GET   /api/v1/assessments/{id}/result     final result, only when COMPLETED
 */
@RestController
@RequestMapping("/api/v1/assessments")
public class AssessmentController {

    private final AssessmentService service;

    public AssessmentController(AssessmentService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssessmentState start(Authentication auth, @Valid @RequestBody StartRequest request) {
        return service.start(userId(auth), request.getTrackId());
    }

    @GetMapping("/{id}")
    public AssessmentState state(Authentication auth, @PathVariable UUID id) {
        return service.state(userId(auth), id);
    }

    @PostMapping("/{id}/responses")
    public AssessmentState answer(Authentication auth, @PathVariable UUID id,
                                  @Valid @RequestBody AnswerRequest request) {
        return service.answer(userId(auth), id, request.getItemId(), request.getSelectedOption());
    }

    @GetMapping("/{id}/result")
    public ResultView result(Authentication auth, @PathVariable UUID id) {
        return service.result(userId(auth), id);
    }

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
