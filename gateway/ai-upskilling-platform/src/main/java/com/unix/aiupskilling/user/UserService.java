package com.unix.aiupskilling.user;

import com.unix.aiupskilling.user.UserResponse;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
}
