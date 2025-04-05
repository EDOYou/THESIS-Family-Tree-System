package com.familytree.model.dto;

import com.familytree.model.FamilyEvent;
import lombok.Data;

import java.time.LocalDate;

@Data
public class FamilyEventDTO {
    private String id;
    private String title;
    private String eventType;
    private LocalDate eventDate;
    private LocalDate reminderDate;
    private boolean isMemorial;
    private String personName;
    private String createdByUsername;

    public FamilyEventDTO(FamilyEvent event) {
        this.id = event.getId();
        this.title = event.getTitle();
        this.eventType = event.getEventType();
        this.eventDate = event.getEventDate();
        this.reminderDate = event.getReminderDate();
        this.isMemorial = event.isMemorial();
        this.personName = event.getPerson().getName();
        this.createdByUsername = event.getCreatedBy().getUsername();
    }
}