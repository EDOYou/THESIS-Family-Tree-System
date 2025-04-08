package com.familytree.controller;

import com.familytree.model.FamilyEvent;
import com.familytree.model.dto.FamilyEventDTO;
import com.familytree.service.FamilyEventService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/events")
public class FamilyEventController {

    private final FamilyEventService familyEventService;

    public FamilyEventController(FamilyEventService familyEventService) {
        this.familyEventService = familyEventService;
    }

    @GetMapping
    public ResponseEntity<List<FamilyEventDTO>> getAllEvents() {
        List<FamilyEventDTO> eventDTOs = familyEventService.getAllEvents();
        return ResponseEntity.ok(eventDTOs);
    }

    @GetMapping("/reminders")
    public ResponseEntity<List<FamilyEventDTO>> getReminders() {
        List<FamilyEventDTO> eventDTOs = familyEventService.getReminders();
        return ResponseEntity.ok(eventDTOs);
    }

    @PostMapping
    public ResponseEntity<FamilyEventDTO> createEvent(@Valid @RequestBody FamilyEvent event) {
        FamilyEventDTO eventDTO = familyEventService.createEvent(event);
        return ResponseEntity.ok(eventDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable String id) {
        familyEventService.deleteEvent(id);
        return ResponseEntity.ok().build();
    }
}