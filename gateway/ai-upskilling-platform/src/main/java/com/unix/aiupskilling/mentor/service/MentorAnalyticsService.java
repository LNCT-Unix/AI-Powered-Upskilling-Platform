package com.unix.aiupskilling.mentor.service;

import com.unix.aiupskilling.mentor.dto.MentorAnalyticsTestResponse;
import com.unix.aiupskilling.mentor.dto.MentorRecentActivityItemDto;

import java.time.LocalDate;
import java.util.List;

public interface MentorAnalyticsService {

    MentorAnalyticsTestResponse getTestAnalytics(Long mentorUserId, LocalDate from, LocalDate to, String track);

    List<MentorRecentActivityItemDto> getRecentActivity(Long mentorUserId, int limit, String studentId, String status);
}

