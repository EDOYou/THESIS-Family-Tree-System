package com.familytree.service;

import com.familytree.exception.UnauthenticatedException;
import com.familytree.exception.UserNotFoundException;
import com.familytree.model.User;
import com.familytree.model.dto.AuthResponse;
import com.familytree.model.dto.RegisterRequest;
import com.familytree.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User user;
    private RegisterRequest registerRequest;

    @BeforeEach
    public void setUp() {
        user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("encodedPassword");
        user.setRole("USER");

        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password");
        registerRequest.setRole("USER");
    }

    @Test
    public void testRegister_Success() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        AuthResponse response = authService.register(registerRequest);
        assertEquals("testuser", response.getUsername());
        assertEquals("USER", response.getRole());
    }

    @Test
    public void testRegister_UsernameExists() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        assertThrows(RuntimeException.class, () -> authService.register(registerRequest));
    }

    @Test
    public void testRegister_EmailExists() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        assertThrows(RuntimeException.class, () -> authService.register(registerRequest));
    }

    @Test
    public void testGetCurrentUser_Success() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        User result = authService.getCurrentUser(authentication);
        assertEquals("testuser", result.getUsername());
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    public void testGetCurrentUser_NotAuthenticated() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(false);

        assertThrows(UnauthenticatedException.class, () -> authService.getCurrentUser(authentication));
    }

    @Test
    public void testGetCurrentUser_NullAuthentication() {
        assertThrows(UnauthenticatedException.class, () -> authService.getCurrentUser(null));
    }

    @Test
    public void testGetCurrentUser_UserNotFound() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> authService.getCurrentUser(authentication));
    }
}