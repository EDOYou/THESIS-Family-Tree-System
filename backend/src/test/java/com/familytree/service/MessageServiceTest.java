package com.familytree.service;

import com.familytree.exception.InvalidMessageException;
import com.familytree.exception.UnauthenticatedException;
import com.familytree.exception.UserNotFoundException;
import com.familytree.model.Message;
import com.familytree.model.User;
import com.familytree.model.dto.MessageDTO;
import com.familytree.repository.MessageRepository;
import com.familytree.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MessageService messageService;

    private Message message;
    private MessageDTO messageDTO;
    private User user;

    @BeforeEach
    public void setUp() {
        Long userId = 1L;

        user = new User();
        user.setId(userId);
        user.setUsername("testuser");

        message = new Message();
        message.setId(UUID.randomUUID().toString());
        message.setContent("Hello");
        message.setSender(user);
        message.setConversationId("conv1");

        messageDTO = new MessageDTO();
        messageDTO.setContent("Hello");
        messageDTO.setSenderUsername("testuser");
        messageDTO.setConversationId("conv1");
    }

    @Test
    public void testGetAllMessages_Success() {
        when(messageRepository.findAllByOrderByTimestampAsc()).thenReturn(Arrays.asList(message));

        var result = messageService.getAllMessages();
        assertEquals(1, result.size());
        assertEquals("Hello", result.get(0).getContent());
        assertEquals("testuser", result.get(0).getSenderUsername());
    }

    @Test
    public void testCreateMessage_Success() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        MessageDTO result = messageService.createMessage(message);
        assertEquals("Hello", result.getContent());
        assertEquals("testuser", result.getSenderUsername());
    }

    @Test
    public void testCreateMessage_EmptyContent() {
        message.setContent("");
        assertThrows(InvalidMessageException.class, () -> messageService.createMessage(message));
    }

    @Test
    public void testCreateMessage_NotAuthenticated() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(false);

        assertThrows(UnauthenticatedException.class, () -> messageService.createMessage(message));
    }

    @Test
    public void testCreateMessage_UserNotFound() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> messageService.createMessage(message));
    }

    @Test
    public void testSendMessage_Success() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(messageRepository.save(any(Message.class))).thenReturn(message);

        MessageDTO result = messageService.sendMessage(messageDTO);
        assertEquals("Hello", result.getContent());
        assertEquals("testuser", result.getSenderUsername());
        assertEquals("conv1", result.getConversationId());
    }

    @Test
    public void testSendMessage_EmptyContent() {
        messageDTO.setContent("");
        assertThrows(InvalidMessageException.class, () -> messageService.sendMessage(messageDTO));
    }

    @Test
    public void testSendMessage_EmptySenderUsername() {
        messageDTO.setSenderUsername("");
        assertThrows(InvalidMessageException.class, () -> messageService.sendMessage(messageDTO));
    }

    @Test
    public void testSendMessage_UserNotFound() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> messageService.sendMessage(messageDTO));
    }
}