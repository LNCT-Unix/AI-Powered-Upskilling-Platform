package com.unix.ai_upskilling_platform.authentication.service;

import com.unix.ai_upskilling_platform.model.entity.User;

import java.util.Optional;

public interface UserProvisioningService {

    Optional<User> findByEmail(String rawEmail);

    User createEmailUser(String rawEmail, String fullName, String passwordHash);

    User createOAuthUser(String verifiedEmail, String fullName);
}
