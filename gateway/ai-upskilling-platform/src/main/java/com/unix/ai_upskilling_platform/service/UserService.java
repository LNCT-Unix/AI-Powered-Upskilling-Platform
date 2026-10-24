package com.unix.ai_upskilling_platform.service;

import com.unix.ai_upskilling_platform.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
}
