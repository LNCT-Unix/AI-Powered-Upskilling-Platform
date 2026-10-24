package com.teamunix.gateway.assessment;

import com.teamunix.gateway.assessment.AssessmentDtos.*;
import jakarta.validation.Valid;
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

/**
 * The four assessment endpoints. The JWT subject must be the user id (UUID).
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

    private static UUID userId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
