package com.unix.ai_upskilling_platform.authentication.service;

import com.unix.ai_upskilling_platform.model.entity.User;

public interface AccountEligibilityService {

    void assertCanLoginWithPassword(User u);

    void assertCanAuthenticate(User u);
}
