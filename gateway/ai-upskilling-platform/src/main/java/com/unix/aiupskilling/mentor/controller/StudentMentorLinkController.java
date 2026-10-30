package com.unix.aiupskilling.mentor.controller;

import com.unix.aiupskilling.mentor.dto.StudentMentorLinkRequest;
import com.unix.aiupskilling.mentor.dto.StudentMentorLinkResponse;
import com.unix.aiupskilling.mentor.service.StudentMentorLinkService;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import com.unix.aiupskilling.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentMentorLinkController {

    private final StudentMentorLinkService studentMentorLinkService;

    @PostMapping("/mentor-link")
    public ResponseEntity<ApiResponse<StudentMentorLinkResponse>> linkMentor(
            Authentication authentication,
            @Valid @RequestBody StudentMentorLinkRequest request,
            HttpServletRequest httpRequest) {

        User user = (User) authentication.getPrincipal();
        String clientIp = resolveClientIp(httpRequest);

        StudentMentorLinkResponse response = studentMentorLinkService.linkStudentToMentor(
                user.getId(),
                request.getKey(),
                clientIp
        );

        String message = response.isAlreadyLinked()
                ? "You are already linked to this mentor."
                : "Mentor linked successfully.";

        return ResponseEntity.ok(ApiResponse.ok(response, message));
    }

    @GetMapping("/mentor-link")
    public ResponseEntity<ApiResponse<StudentMentorLinkResponse>> getMentorLink(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        StudentMentorLinkResponse response = studentMentorLinkService.getStudentMentor(user.getId());
        String message = response != null ? "Mentor link found." : "No mentor linked.";
        return ResponseEntity.ok(ApiResponse.ok(response, message));
    }

    @DeleteMapping("/mentor-link")
    public ResponseEntity<ApiResponse<Void>> unlinkMentor(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        studentMentorLinkService.unlinkStudentFromMentor(user.getId());
        return ResponseEntity.ok(ApiResponse.ok(null, "Unlinked from mentor successfully."));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

