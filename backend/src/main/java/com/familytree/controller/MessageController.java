package com.familytree.controller;

import com.familytree.model.Message;
import com.familytree.model.User;
import com.familytree.model.dto.MessageDTO;
import com.familytree.repository.MessageRepository;
import com.familytree.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

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

        messagingTemplate.convertAndSend("/topic/messages", messageDTO);

        return ResponseEntity.ok(messageDTO);
    }

    @MessageMapping("/chat.sendMessage")
    @Transactional
    public void sendMessage(@Payload MessageDTO messageDTO) {
        log.info("Received WebSocket message with content: {}", messageDTO.getContent());
        if (messageDTO.getContent() == null || messageDTO.getContent().trim().isEmpty()) {
            log.warn("Message content is empty");
            return;
        }

        String username = messageDTO.getSenderUsername();
        if (username == null || username.trim().isEmpty()) {
            log.warn("Sender username is missing in the message");
            return;
        }

        User sender = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found: " + username));

        Message message = new Message();
        message.setContent(messageDTO.getContent());
        message.setSender(sender);
        message.setConversationId(messageDTO.getConversationId());

        Message savedMessage = messageRepository.save(message);
        MessageDTO savedMessageDTO = new MessageDTO(savedMessage);
        log.info("Broadcasting message with ID: {}", savedMessage.getId());

        messagingTemplate.convertAndSend("/topic/messages", savedMessageDTO);
    }
}