package com.unix.aiupskilling.mentor.controller;

import com.unix.aiupskilling.mentor.dto.MentorKeyRequest;
import com.unix.aiupskilling.mentor.dto.MentorKeyResponse;
import com.unix.aiupskilling.mentor.model.entity.MentorKey;
import com.unix.aiupskilling.mentor.model.enums.MentorKeyStatus;
import com.unix.aiupskilling.mentor.repository.MentorKeyRepository;
import com.unix.aiupskilling.mentor.service.MentorKeyService;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import com.unix.aiupskilling.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/mentor/key")
@RequiredArgsConstructor
public class MentorKeyController {

    private final MentorKeyService mentorKeyService;
    private final MentorKeyRepository mentorKeyRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<MentorKeyResponse>> getKey(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Optional<MentorKeyResponse> keyOpt = mentorKeyService.getActiveKey(user.getId());

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CACHE_CONTROL, "no-store");

        if (keyOpt.isPresent()) {
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(ApiResponse.ok(keyOpt.get(), "Mentor key retrieved"));
        } else {
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(ApiResponse.ok(null, "No mentor key exists yet."));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MentorKeyResponse>> generateOrReplaceKey(
            Authentication authentication,
            @Valid @RequestBody MentorKeyRequest request) {

        User user = (User) authentication.getPrincipal();
        boolean hadActiveKey = mentorKeyRepository.findByMentorUserIdAndStatus(user.getId(), MentorKeyStatus.ACTIVE).isPresent();

        MentorKeyResponse response = mentorKeyService.generateOrReplaceKey(user.getId(), request.getReplaceExisting());

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CACHE_CONTROL, "no-store");

        if (!hadActiveKey) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .headers(headers)
                    .body(ApiResponse.ok(response, "Mentor key generated."));
        } else {
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(ApiResponse.ok(response, "Mentor key replaced."));
        }
    }
}

