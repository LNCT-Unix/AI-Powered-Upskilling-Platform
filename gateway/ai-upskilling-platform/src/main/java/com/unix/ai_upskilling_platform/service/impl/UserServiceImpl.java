package com.unix.ai_upskilling_platform.service.impl;

import com.unix.ai_upskilling_platform.dto.response.UserResponse;
import com.unix.ai_upskilling_platform.repository.UserRepository;
import com.unix.ai_upskilling_platform.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public List<UserResponse> getAllUsers() {
        return List.of();
    }

    @Override
    public UserResponse getUserById(Long id) {
        return null;
    }
}
