package com.unix.aiupskilling.mentor.controller;

import com.unix.aiupskilling.mentor.dto.MentorDashboardOverviewResponse;
import com.unix.aiupskilling.mentor.service.MentorDashboardService;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import com.unix.aiupskilling.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/mentor/dashboard")
@RequiredArgsConstructor
public class MentorDashboardController {

    private final MentorDashboardService mentorDashboardService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<MentorDashboardOverviewResponse>> getOverview(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        MentorDashboardOverviewResponse response = mentorDashboardService.getOverview(user.getId());

        return ResponseEntity.ok(ApiResponse.ok(response, "Mentor overview retrieved"));
    }
}

