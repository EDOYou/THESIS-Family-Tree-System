package com.familytree.service;

import com.familytree.exception.InvalidMessageException;
import com.familytree.exception.UnauthenticatedException;
import com.familytree.exception.UserNotFoundException;
import com.familytree.model.Message;
import com.familytree.model.User;
import com.familytree.model.dto.MessageDTO;
import com.familytree.repository.MessageRepository;
import com.familytree.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageService(MessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    public List<MessageDTO> getAllMessages() {
        log.info("Fetching all messages");
        List<Message> messages = messageRepository.findAllByOrderByTimestampAsc();
        List<MessageDTO> messageDTOs = messages.stream()
                .map(MessageDTO::new)
                .collect(Collectors.toList());
        log.info("Returning {} messages", messageDTOs.size());
        return messageDTOs;
    }

    @Transactional
    public MessageDTO createMessage(Message message) {
        log.info("Creating message with content: {}", message.getContent());
        if (message.getContent() == null || message.getContent().trim().isEmpty()) {
            log.warn("Message content is empty");
            throw new InvalidMessageException("Message content cannot be empty");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthenticatedException("User is not authenticated");
        }

        String username = authentication.getName();
        User sender = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("Authenticated user not found: {}", username);
                    return new UserNotFoundException("Authenticated user not found: " + username);
                });

        message.setSender(sender);
        Message savedMessage = messageRepository.save(message);
        MessageDTO messageDTO = new MessageDTO(savedMessage);
        log.info("Created message with ID: {}", savedMessage.getId());
        return messageDTO;
    }

    @Transactional
    public MessageDTO sendMessage(MessageDTO messageDTO) {
        log.info("Received WebSocket message with content: {}", messageDTO.getContent());
        if (messageDTO.getContent() == null || messageDTO.getContent().trim().isEmpty()) {
            log.warn("Message content is empty");
            throw new InvalidMessageException("Message content cannot be empty");
        }

        String username = messageDTO.getSenderUsername();
        if (username == null || username.trim().isEmpty()) {
            log.warn("Sender username is missing in the message");
            throw new InvalidMessageException("Sender username cannot be empty");
        }

        User sender = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User not found: {}", username);
                    return new UserNotFoundException("User not found: " + username);
                });

        Message message = new Message();
        message.setContent(messageDTO.getContent());
        message.setSender(sender);
        message.setConversationId(messageDTO.getConversationId());

        Message savedMessage = messageRepository.save(message);
        MessageDTO savedMessageDTO = new MessageDTO(savedMessage);
        log.info("Broadcasting message with ID: {}", savedMessage.getId());
        return savedMessageDTO;
    }
}