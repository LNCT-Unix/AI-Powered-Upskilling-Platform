package com.unix.aiupskilling.user;

import com.unix.aiupskilling.user.dto.UpdateProfileRequest;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
    UserResponse getCurrentUserProfile(Long userId);
    UserResponse updateProfile(Long userId, UpdateProfileRequest request);
}
