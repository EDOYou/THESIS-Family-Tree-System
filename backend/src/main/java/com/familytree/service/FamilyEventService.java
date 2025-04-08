package com.familytree.service;

import com.familytree.exception.*;
import com.familytree.model.FamilyEvent;
import com.familytree.model.Person;
import com.familytree.model.User;
import com.familytree.model.dto.FamilyEventDTO;
import com.familytree.repository.FamilyEventRepository;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class FamilyEventService {

    private final FamilyEventRepository familyEventRepository;
    private final PersonRepository personRepository;
    private final UserRepository userRepository;

    public FamilyEventService(FamilyEventRepository familyEventRepository,
                              PersonRepository personRepository,
                              UserRepository userRepository) {
        this.familyEventRepository = familyEventRepository;
        this.personRepository = personRepository;
        this.userRepository = userRepository;
    }

    public List<FamilyEventDTO> getAllEvents() {
        log.info("Fetching all family events");
        List<FamilyEvent> events = familyEventRepository.findAllByOrderByEventDateAsc();
        List<FamilyEventDTO> eventDTOs = events.stream()
                .map(FamilyEventDTO::new)
                .collect(Collectors.toList());
        log.info("Returning {} events", eventDTOs.size());
        return eventDTOs;
    }

    public List<FamilyEventDTO> getReminders() {
        log.info("Fetching all family events with active reminders");
        List<FamilyEvent> events = familyEventRepository.findByReminderDateLessThanEqualOrderByEventDateAsc(LocalDate.now());
        List<FamilyEventDTO> eventDTOs = events.stream()
                .map(FamilyEventDTO::new)
                .collect(Collectors.toList());
        log.info("Returning {} events with active reminders", eventDTOs.size());
        return eventDTOs;
    }

    @Transactional
    public FamilyEventDTO createEvent(FamilyEvent event) {
        log.info("Creating family event: {}", event.getTitle());
        if (event.getTitle() == null || event.getTitle().trim().isEmpty()) {
            log.warn("Event title is empty");
            throw new InvalidEventException("Event title cannot be empty");
        }
        if (event.getEventType() == null || event.getEventType().trim().isEmpty()) {
            log.warn("Event type is empty");
            throw new InvalidEventException("Event type cannot be empty");
        }
        if (event.getEventDate() == null) {
            log.warn("Event date is missing");
            throw new InvalidEventException("Event date is required");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthenticatedException("User is not authenticated");
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("Authenticated user not found: {}", username);
                    return new UserNotFoundException("Authenticated user not found: " + username);
                });

        Person person = personRepository.findById(event.getPerson().getId())
                .orElseThrow(() -> {
                    log.warn("Person not found: {}", event.getPerson().getId());
                    return new IllegalStateException("Person not found: " + event.getPerson().getId());
                });

        event.setCreatedBy(user);
        event.setPerson(person);

        FamilyEvent savedEvent = familyEventRepository.save(event);
        FamilyEventDTO eventDTO = new FamilyEventDTO(savedEvent);
        log.info("Created family event with ID: {}", savedEvent.getId());
        return eventDTO;
    }

    @Transactional
    public void deleteEvent(String id) {
        log.info("Deleting family event with ID: {}", id);
        FamilyEvent event = familyEventRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Family event with ID: {} not found", id);
                    return new EventNotFoundException(id);
                });

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthenticatedException("User is not authenticated");
        }

        String username = authentication.getName();
        if (!event.getCreatedBy().getUsername().equals(username)) {
            log.warn("User {} is not authorized to delete event {}", username, id);
            throw new UnauthorizedEventAccessException("User " + username + " is not authorized to delete event " + id);
        }

        familyEventRepository.delete(event);
        log.info("Deleted family event with ID: {}", id);
    }
}