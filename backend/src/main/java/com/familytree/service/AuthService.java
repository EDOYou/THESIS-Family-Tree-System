package com.familytree.service;

import com.familytree.exception.UnauthenticatedException;
import com.familytree.exception.UserNotFoundException;
import com.familytree.model.User;
import com.familytree.model.dto.AuthResponse;
import com.familytree.model.dto.RegisterRequest;
import com.familytree.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole() : "USER");
        user.setDateOfBirth(request.getDateOfBirth());

        userRepository.save(user);
        return new AuthResponse(user.getUsername(), user.getRole());
    }

    public User getCurrentUser(Authentication authentication) {
        log.info("Get current user: {}", authentication);
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthenticatedException("User is not authenticated");
        }

        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .map(user -> {
                    log.info("Found user: {}", user);
                    return user;
                })
                .orElseThrow(() -> {
                    log.warn("User not found for username: {}", username);
                    return new UserNotFoundException("User not found for username: " + username);
                });
    }
}