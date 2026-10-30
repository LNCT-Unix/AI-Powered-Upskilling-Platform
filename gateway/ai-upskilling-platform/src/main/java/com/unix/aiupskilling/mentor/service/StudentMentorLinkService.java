package com.unix.aiupskilling.mentor.service;

import com.unix.aiupskilling.mentor.dto.StudentMentorLinkResponse;

public interface StudentMentorLinkService {

    StudentMentorLinkResponse linkStudentToMentor(Long studentUserId, String keyValue, String clientIp);

    StudentMentorLinkResponse getStudentMentor(Long studentUserId);

    void unlinkStudentFromMentor(Long studentUserId);
}


