package com.familytree.controller;

import com.familytree.model.Message;
import com.familytree.model.User;
import com.familytree.model.dto.MessageDTO;
import com.familytree.repository.MessageRepository;
import com.familytree.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@Slf4j
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<MessageDTO>> getAllMessages() {
        log.info("Fetching all messages");
        List<Message> messages = messageRepository.findAllByOrderByTimestampAsc();
        List<MessageDTO> messageDTOs = messages.stream()
                .map(MessageDTO::new)
                .collect(Collectors.toList());
        log.info("Returning {} messages", messageDTOs.size());
        return ResponseEntity.ok(messageDTOs);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<MessageDTO> createMessage(@Valid @RequestBody Message message) {
        log.info("Creating message with content: {}", message.getContent());
        if (message.getContent() == null || message.getContent().trim().isEmpty()) {
            log.warn("Message content is empty");
            return ResponseEntity.badRequest().body(null);
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User sender = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + username));

        message.setSender(sender);

        Message savedMessage = messageRepository.save(message);
        MessageDTO messageDTO = new MessageDTO(savedMessage);
        log.info("Created message with ID: {}", savedMessage.getId());
        return ResponseEntity.ok(messageDTO);
    }
}