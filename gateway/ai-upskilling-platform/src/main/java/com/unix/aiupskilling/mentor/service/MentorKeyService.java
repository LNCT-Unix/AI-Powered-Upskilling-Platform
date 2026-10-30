package com.unix.aiupskilling.mentor.service;

import com.unix.aiupskilling.mentor.dto.MentorKeyResponse;

import java.util.Optional;

public interface MentorKeyService {

    Optional<MentorKeyResponse> getActiveKey(Long mentorUserId);

    MentorKeyResponse generateOrReplaceKey(Long mentorUserId, boolean replaceExisting);
}

