package com.familytree.model;

import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "family_events")
public class FamilyEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title; // e.g., "John's Birthday"

    @Column(nullable = false)
    private String eventType; // e.g., "BIRTHDAY", "WEDDING", "MEMORIAL"

    @Column(nullable = false)
    private LocalDate eventDate;

    private LocalDate reminderDate; // Date to send a reminder

    @Column(nullable = false)
    private boolean isMemorial; // Flag for memorial events

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person; // The person associated with the event

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy; // The user who created the event

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}