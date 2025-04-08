package com.familytree.service;

import com.familytree.exception.InvalidEventException;
import com.familytree.exception.UnauthenticatedException;
import com.familytree.exception.UnauthorizedEventAccessException;
import com.familytree.exception.UserNotFoundException;
import com.familytree.model.FamilyEvent;
import com.familytree.model.Person;
import com.familytree.model.User;
import com.familytree.model.dto.FamilyEventDTO;
import com.familytree.repository.FamilyEventRepository;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FamilyEventServiceTest {

    @Mock
    private FamilyEventRepository familyEventRepository;

    @Mock
    private PersonRepository personRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FamilyEventService familyEventService;

    private FamilyEvent event;
    private Person person;
    private User user;
    private String personId;

    @BeforeEach
    public void setUp() {
        personId = UUID.randomUUID().toString();
        Long userId = 1L;

        person = new Person();
        person.setId(personId);
        person.setName("John Doe");

        user = new User();
        user.setId(userId);
        user.setUsername("testuser");

        event = new FamilyEvent();
        event.setId(UUID.randomUUID().toString());
        event.setTitle("Birthday");
        event.setEventType("Celebration");
        event.setEventDate(LocalDate.now());
        event.setPerson(person);
        event.setCreatedBy(user);
    }

    @Test
    public void testGetAllEventsSuccess() {
        when(familyEventRepository.findAllByOrderByEventDateAsc()).thenReturn(Arrays.asList(event));

        List<FamilyEventDTO> result = familyEventService.getAllEvents();
        assertEquals(1, result.size());
        assertEquals("Birthday", result.get(0).getTitle());
        assertEquals("John Doe", result.get(0).getPersonName());
        assertEquals("testuser", result.get(0).getCreatedByUsername());
    }

    @Test
    public void testGetRemindersSuccess() {
        when(familyEventRepository.findByReminderDateLessThanEqualOrderByEventDateAsc(any(LocalDate.class)))
                .thenReturn(Arrays.asList(event));

        List<FamilyEventDTO> result = familyEventService.getReminders();
        assertEquals(1, result.size());
        assertEquals("Birthday", result.get(0).getTitle());
    }

    @Test
    public void testCreateEventSuccess() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(personRepository.findById(personId)).thenReturn(Optional.of(person));
        when(familyEventRepository.save(any(FamilyEvent.class))).thenReturn(event);

        FamilyEventDTO result = familyEventService.createEvent(event);
        assertEquals("Birthday", result.getTitle());
        assertEquals("John Doe", result.getPersonName());
        assertEquals("testuser", result.getCreatedByUsername());
    }

    @Test
    public void testCreateEventEmptyTitle() {
        event.setTitle("");
        assertThrows(InvalidEventException.class, () -> familyEventService.createEvent(event));
    }

    @Test
    public void testCreateEvent_EmptyEventType() {
        event.setEventType("");
        assertThrows(InvalidEventException.class, () -> familyEventService.createEvent(event));
    }

    @Test
    public void testCreateEventMissingEventDate() {
        event.setEventDate(null);
        assertThrows(InvalidEventException.class, () -> familyEventService.createEvent(event));
    }

    @Test
    public void testCreateEventNotAuthenticated() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(false);

        assertThrows(UnauthenticatedException.class, () -> familyEventService.createEvent(event));
    }

    @Test
    public void testCreateEventUserNotFound() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> familyEventService.createEvent(event));
    }

    @Test
    public void testCreateEventPersonNotFound() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(personRepository.findById(personId)).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () -> familyEventService.createEvent(event));
    }

    @Test
    public void testDeleteEventSuccess() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(familyEventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        familyEventService.deleteEvent(event.getId());
        verify(familyEventRepository).delete(event);
    }

    @Test
    public void testDeleteEventUnauthorized() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("otheruser");

        when(familyEventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        assertThrows(UnauthorizedEventAccessException.class, () -> familyEventService.deleteEvent(event.getId()));
    }
}