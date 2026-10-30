package com.unix.aiupskilling.mentor.controller;

import com.unix.aiupskilling.mentor.dto.AchievementFacetsResponse;
import com.unix.aiupskilling.mentor.dto.AchievementRowDto;
import com.unix.aiupskilling.mentor.service.MentorAchievementService;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import com.unix.aiupskilling.shared.dto.PagedResponse;
import com.unix.aiupskilling.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/mentor/achievements")
@RequiredArgsConstructor
public class MentorAchievementController {

    private final MentorAchievementService mentorAchievementService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<AchievementRowDto>>> getAchievements(
            Authentication authentication,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String proficiency,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false, defaultValue = "date_desc") String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {

        User user = (User) authentication.getPrincipal();
        PagedResponse<AchievementRowDto> response = mentorAchievementService.getAchievements(
                user.getId(),
                q,
                category,
                proficiency,
                studentId,
                sort,
                page,
                size
        );

        return ResponseEntity.ok(ApiResponse.ok(response, "Achievements retrieved"));
    }

    @GetMapping("/facets")
    public ResponseEntity<ApiResponse<AchievementFacetsResponse>> getFacets(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        AchievementFacetsResponse response = mentorAchievementService.getFacets(user.getId());

        return ResponseEntity.ok(ApiResponse.ok(response, "Achievement facets retrieved"));
    }
}
