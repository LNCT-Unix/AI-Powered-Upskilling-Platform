package com.unix.aiupskilling.mentor.controller;

import com.unix.aiupskilling.mentor.dto.StudentDetailResponse;
import com.unix.aiupskilling.mentor.dto.StudentRowDto;
import com.unix.aiupskilling.mentor.service.MentorStudentService;
import com.unix.aiupskilling.shared.dto.ApiResponse;
import com.unix.aiupskilling.shared.dto.PagedResponse;
import com.unix.aiupskilling.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/mentor/students")
@RequiredArgsConstructor
public class MentorStudentController {

    private final MentorStudentService mentorStudentService;

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<StudentRowDto>>> getStudents(
            Authentication authentication,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String progressBand,
            @RequestParam(required = false, defaultValue = "name") String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {

        User user = (User) authentication.getPrincipal();
        PagedResponse<StudentRowDto> response = mentorStudentService.getStudents(
                user.getId(),
                q,
                progressBand,
                sort,
                page,
                size
        );

        return ResponseEntity.ok(ApiResponse.ok(response, "Students retrieved"));
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<ApiResponse<StudentDetailResponse>> getStudentDetail(
            Authentication authentication,
            @PathVariable Long studentId) {

        User user = (User) authentication.getPrincipal();
        StudentDetailResponse response = mentorStudentService.getStudentDetail(user.getId(), studentId);

        return ResponseEntity.ok(ApiResponse.ok(response, "Student detail retrieved"));
    }
}
