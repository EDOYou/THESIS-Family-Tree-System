package com.familytree.model.dto;

import com.familytree.model.FamilyEvent;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Setter
@Getter
public class FamilyEventDTO {
    private String id;
    private String title;
    private String eventType;
    private LocalDate eventDate;
    private LocalDate reminderDate;
    private boolean isMemorial;
    private String personId;
    private String personName;
    private Long createdById;
    private String createdByUsername;
    private LocalDateTime createdAt;

    public FamilyEventDTO() {}

    public FamilyEventDTO(FamilyEvent event) {
        this.id = event.getId();
        this.title = event.getTitle();
        this.eventType = event.getEventType();
        this.eventDate = event.getEventDate();
        this.reminderDate = event.getReminderDate();
        this.isMemorial = event.isMemorial();
        this.personId = event.getPerson().getId();
        this.personName = event.getPerson().getName();
        this.createdById = event.getCreatedBy().getId();
        this.createdByUsername = event.getCreatedBy().getUsername();
        this.createdAt = event.getCreatedAt();
    }
}