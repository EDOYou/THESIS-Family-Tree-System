package com.familytree.controller;

import com.familytree.exception.UnauthenticatedException;
import com.familytree.exception.UserNotFoundException;
import com.familytree.model.User;
import com.familytree.model.dto.AuthResponse;
import com.familytree.model.dto.RegisterRequest;
import com.familytree.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {
        try {
            User user = authService.getCurrentUser(authentication);
            return ResponseEntity.ok(user);
        } catch (UnauthenticatedException e) {
            return ResponseEntity.status(401).build();
        } catch (UserNotFoundException e) {
            return ResponseEntity.status(404).build();
        }
    }
}