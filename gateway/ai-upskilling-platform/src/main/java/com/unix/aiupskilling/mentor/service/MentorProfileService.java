package com.unix.aiupskilling.mentor.service;

import com.unix.aiupskilling.mentor.dto.MentorProfileResponse;
import com.unix.aiupskilling.mentor.dto.UpdateMentorProfileRequest;

public interface MentorProfileService {

    MentorProfileResponse getProfile(Long mentorUserId);

    MentorProfileResponse updateProfile(Long mentorUserId, UpdateMentorProfileRequest request);
}

