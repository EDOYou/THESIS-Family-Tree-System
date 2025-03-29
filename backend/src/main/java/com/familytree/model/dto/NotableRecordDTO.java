package com.familytree.model.dto;

import com.familytree.model.NotableRecord;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Setter
@Getter
public class NotableRecordDTO {
    private String id;
    private String title;
    private String type;
    private String description;
    private LocalDate date;
    private String personId;
    private String personName;
    private Long createdById;
    private String createdByUsername;
    private LocalDateTime createdAt;

    public NotableRecordDTO() {}

    public NotableRecordDTO(NotableRecord record) {
        this.id = record.getId();
        this.title = record.getTitle();
        this.type = record.getType();
        this.description = record.getDescription();
        this.date = record.getDate();
        this.personId = record.getPerson().getId();
        this.personName = record.getPerson().getName();
        this.createdById = record.getCreatedBy().getId();
        this.createdByUsername = record.getCreatedBy().getUsername();
        this.createdAt = record.getCreatedAt();
    }
}