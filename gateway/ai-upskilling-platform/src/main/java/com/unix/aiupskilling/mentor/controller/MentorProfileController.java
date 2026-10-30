package com.unix.aiupskilling.mentor.controller;

import com.unix.aiupskilling.mentor.dto.MentorProfileResponse;
import com.unix.aiupskilling.mentor.dto.UpdateMentorProfileRequest;
import com.unix.aiupskilling.mentor.service.MentorProfileService;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import com.unix.aiupskilling.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/mentor/profile")
@RequiredArgsConstructor
public class MentorProfileController {

    private final MentorProfileService mentorProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<MentorProfileResponse>> getProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        MentorProfileResponse response = mentorProfileService.getProfile(user.getId());

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CACHE_CONTROL, "no-store");

        return ResponseEntity.ok()
                .headers(headers)
                .body(ApiResponse.ok(response, "Mentor profile retrieved"));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<MentorProfileResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateMentorProfileRequest request) {

        User user = (User) authentication.getPrincipal();
        MentorProfileResponse response = mentorProfileService.updateProfile(user.getId(), request);

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CACHE_CONTROL, "no-store");

        return ResponseEntity.ok()
                .headers(headers)
                .body(ApiResponse.ok(response, "Mentor profile updated"));
    }
}

