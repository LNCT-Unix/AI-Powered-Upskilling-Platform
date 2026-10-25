package com.unix.aiupskilling.authentication.service;

import com.unix.aiupskilling.user.User;

import java.util.Optional;

public interface UserProvisioningService {

    Optional<User> findByEmail(String rawEmail);

    User createEmailUser(String rawEmail, String fullName, String passwordHash);

    User createOAuthUser(String verifiedEmail, String fullName);
}
