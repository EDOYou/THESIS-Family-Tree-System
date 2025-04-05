package com.familytree.controller;

import com.familytree.model.FamilyEvent;
import com.familytree.model.Person;
import com.familytree.model.User;
import com.familytree.model.dto.FamilyEventDTO;
import com.familytree.repository.FamilyEventRepository;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
@Slf4j
public class FamilyEventController {

    @Autowired
    private FamilyEventRepository familyEventRepository;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<FamilyEventDTO>> getAllEvents() {
        log.info("Fetching all family events");
        List<FamilyEvent> events = familyEventRepository.findAllByOrderByEventDateAsc();
        List<FamilyEventDTO> eventDTOs = events.stream()
                .map(FamilyEventDTO::new)
                .collect(Collectors.toList());
        log.info("Returning {} events", eventDTOs.size());
        return ResponseEntity.ok(eventDTOs);
    }

    @GetMapping("/reminders")
    public ResponseEntity<List<FamilyEventDTO>> getReminders() {
        log.info("Fetching all family events with active reminders");
        List<FamilyEvent> events = familyEventRepository.findByReminderDateLessThanEqualOrderByEventDateAsc(LocalDate.now());
        List<FamilyEventDTO> eventDTOs = events.stream()
                .map(FamilyEventDTO::new)
                .collect(Collectors.toList());
        log.info("Returning {} events with active reminders", eventDTOs.size());
        return ResponseEntity.ok(eventDTOs);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<FamilyEventDTO> createEvent(@Valid @RequestBody FamilyEvent event) {
        log.info("Creating family event: {}", event.getTitle());
        if (event.getTitle() == null || event.getTitle().trim().isEmpty()) {
            log.warn("Event title is empty");
            return ResponseEntity.badRequest().body(null);
        }
        if (event.getEventType() == null || event.getEventType().trim().isEmpty()) {
            log.warn("Event type is empty");
            return ResponseEntity.badRequest().body(null);
        }
        if (event.getEventDate() == null) {
            log.warn("Event date is missing");
            return ResponseEntity.badRequest().body(null);
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + username));

        Person person = personRepository.findById(event.getPerson().getId())
                .orElseThrow(() -> new IllegalStateException("Person not found: " + event.getPerson().getId()));

        event.setCreatedBy(user);
        event.setPerson(person);

        FamilyEvent savedEvent = familyEventRepository.save(event);
        FamilyEventDTO eventDTO = new FamilyEventDTO(savedEvent);
        log.info("Created family event with ID: {}", savedEvent.getId());
        return ResponseEntity.ok(eventDTO);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteEvent(@PathVariable String id) {
        log.info("Deleting family event with ID: {}", id);
        return familyEventRepository.findById(id)
                .map(event -> {
                    String username = SecurityContextHolder.getContext().getAuthentication().getName();
                    if (!event.getCreatedBy().getUsername().equals(username)) {
                        log.warn("User {} is not authorized to delete event {}", username, id);
                        return ResponseEntity.status(403).build();
                    }
                    familyEventRepository.delete(event);
                    log.info("Deleted family event with ID: {}", id);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> {
                    log.warn("Family event with ID: {} not found", id);
                    return ResponseEntity.notFound().build();
                });
    }
}