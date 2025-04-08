package com.familytree.controller;

import com.familytree.model.Message;
import com.familytree.model.dto.MessageDTO;
import com.familytree.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping
    public ResponseEntity<List<MessageDTO>> getAllMessages() {
        List<MessageDTO> messageDTOs = messageService.getAllMessages();
        return ResponseEntity.ok(messageDTOs);
    }

    @PostMapping
    public ResponseEntity<MessageDTO> createMessage(@Valid @RequestBody Message message) {
        MessageDTO messageDTO = messageService.createMessage(message);
        messagingTemplate.convertAndSend("/topic/messages", messageDTO);
        return ResponseEntity.ok(messageDTO);
    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload MessageDTO messageDTO) {
        MessageDTO savedMessageDTO = messageService.sendMessage(messageDTO);
        messagingTemplate.convertAndSend("/topic/messages", savedMessageDTO);
    }
}