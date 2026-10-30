package com.unix.aiupskilling.mentor.service;

import com.unix.aiupskilling.mentor.dto.StudentDetailResponse;
import com.unix.aiupskilling.mentor.dto.StudentRowDto;
import com.unix.aiupskilling.shared.dto.PagedResponse;

public interface MentorStudentService {

    PagedResponse<StudentRowDto> getStudents(
            Long mentorUserId,
            String query,
            String progressBand,
            String sort,
            int page,
            int size
    );

    StudentDetailResponse getStudentDetail(Long mentorUserId, Long studentUserId);
}
