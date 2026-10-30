package com.unix.aiupskilling.mentor.service;

import com.unix.aiupskilling.mentor.dto.MentorDashboardOverviewResponse;

public interface MentorDashboardService {

    MentorDashboardOverviewResponse getOverview(Long mentorUserId);
}

