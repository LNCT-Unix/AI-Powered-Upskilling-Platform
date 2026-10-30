package com.unix.aiupskilling.mentor.controller;

import com.unix.aiupskilling.mentor.dto.MentorAnalyticsTestResponse;
import com.unix.aiupskilling.mentor.dto.MentorRecentActivityItemDto;
import com.unix.aiupskilling.mentor.service.MentorAnalyticsService;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import com.unix.aiupskilling.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/mentor/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MENTOR')")
public class MentorAnalyticsController {

    private final MentorAnalyticsService mentorAnalyticsService;

    @GetMapping("/tests")
    public ResponseEntity<ApiResponse<MentorAnalyticsTestResponse>> getTestAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String track,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        MentorAnalyticsTestResponse response = mentorAnalyticsService.getTestAnalytics(user.getId(), from, to, track);
        return ResponseEntity.ok(ApiResponse.ok(response, "Test analytics retrieved"));
    }

    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<List<MentorRecentActivityItemDto>>> getRecentActivity(
            @RequestParam(required = false, defaultValue = "8") int limit,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String status,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<MentorRecentActivityItemDto> response = mentorAnalyticsService.getRecentActivity(user.getId(), limit, studentId, status);
        return ResponseEntity.ok(ApiResponse.ok(response, "Recent activity retrieved"));
    }
}
