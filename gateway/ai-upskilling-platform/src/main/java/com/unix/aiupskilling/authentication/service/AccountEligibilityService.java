package com.unix.aiupskilling.authentication.service;

import com.unix.aiupskilling.user.User;

public interface AccountEligibilityService {

    void assertCanLoginWithPassword(User u);

    void assertCanAuthenticate(User u);
}
