package com.unix.aiupskilling.user;

import com.unix.aiupskilling.user.UserResponse;
import com.unix.aiupskilling.user.UserRepository;
import com.unix.aiupskilling.user.UserService;
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
