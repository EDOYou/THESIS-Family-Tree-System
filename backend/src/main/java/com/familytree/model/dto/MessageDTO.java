package com.familytree.model.dto;

import com.familytree.model.Message;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
public class MessageDTO {
    private String id;
    private Long senderId;
    private String senderUsername;
    private String content;
    private LocalDateTime timestamp;
    private String conversationId;

    public MessageDTO() {}

    public MessageDTO(Message message) {
        this.id = message.getId();
        this.senderId = message.getSender().getId();
        this.senderUsername = message.getSender().getUsername();
        this.content = message.getContent();
        this.timestamp = message.getTimestamp();
        this.conversationId = message.getConversationId();
    }
}