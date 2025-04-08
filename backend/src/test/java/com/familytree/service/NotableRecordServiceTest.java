package com.familytree.service;

import com.familytree.exception.InvalidNotableRecordException;
import com.familytree.exception.PersonNotFoundException;
import com.familytree.exception.UnauthenticatedException;
import com.familytree.exception.UserNotFoundException;
import com.familytree.exception.UnauthorizedNotableRecordAccessException;
import com.familytree.model.NotableRecord;
import com.familytree.model.Person;
import com.familytree.model.User;
import com.familytree.model.dto.NotableRecordDTO;
import com.familytree.repository.NotableRecordRepository;
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
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotableRecordServiceTest {

    @Mock
    private NotableRecordRepository notableRecordRepository;

    @Mock
    private PersonRepository personRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotableRecordService notableRecordService;

    private NotableRecord record;
    private Person person;
    private User user;
    private String personId;
    private String recordId;

    @BeforeEach
    public void setUp() {
        personId = UUID.randomUUID().toString();
        Long userId = 1L;
        recordId = UUID.randomUUID().toString();

        person = new Person();
        person.setId(personId);
        person.setName("John Doe");

        user = new User();
        user.setId(userId);
        user.setUsername("testuser");

        record = new NotableRecord();
        record.setId(recordId);
        record.setTitle("Achievement");
        record.setType("Award");
        record.setDescription("Won a prize");
        record.setDate(LocalDate.now());
        record.setPerson(person);
        record.setCreatedBy(user);
    }

    @Test
    public void testGetNotableRecordsSuccess() {
        when(personRepository.findById(personId)).thenReturn(Optional.of(person));
        when(notableRecordRepository.findByPersonOrderByCreatedAtDesc(person)).thenReturn(Arrays.asList(record));

        var result = notableRecordService.getNotableRecords(personId);
        assertEquals(1, result.size());
        assertEquals("Achievement", result.get(0).getTitle());
        assertEquals("John Doe", result.get(0).getPersonName());
        assertEquals("testuser", result.get(0).getCreatedByUsername());
    }

    @Test
    public void testGetNotableRecordsPersonNotFound() {
        when(personRepository.findById(personId)).thenReturn(Optional.empty());

        assertThrows(PersonNotFoundException.class, () -> notableRecordService.getNotableRecords(personId));
    }

    @Test
    public void testCreateNotableRecordSuccess() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(personRepository.findById(personId)).thenReturn(Optional.of(person));
        when(notableRecordRepository.save(any(NotableRecord.class))).thenReturn(record);

        NotableRecordDTO result = notableRecordService.createNotableRecord(record);
        assertEquals("Achievement", result.getTitle());
        assertEquals("John Doe", result.getPersonName());
        assertEquals("testuser", result.getCreatedByUsername());
    }

    @Test
    public void testCreateNotableRecordEmptyTitle() {
        record.setTitle("");
        assertThrows(InvalidNotableRecordException.class, () -> notableRecordService.createNotableRecord(record));
    }

    @Test
    public void testCreateNotableRecordEmptyType() {
        record.setType("");
        assertThrows(InvalidNotableRecordException.class, () -> notableRecordService.createNotableRecord(record));
    }

    @Test
    public void testCreateNotableRecordEmptyDescription() {
        record.setDescription("");
        assertThrows(InvalidNotableRecordException.class, () -> notableRecordService.createNotableRecord(record));
    }

    @Test
    public void testCreateNotableRecordNotAuthenticated() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(false);

        assertThrows(UnauthenticatedException.class, () -> notableRecordService.createNotableRecord(record));
    }

    @Test
    public void testCreateNotableRecordUserNotFound() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> notableRecordService.createNotableRecord(record));
    }

    @Test
    public void testCreateNotableRecordPersonNotFound() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(personRepository.findById(personId)).thenReturn(Optional.empty());

        assertThrows(PersonNotFoundException.class, () -> notableRecordService.createNotableRecord(record));
    }

    @Test
    public void testDeleteNotableRecordSuccess() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(notableRecordRepository.findById(recordId)).thenReturn(Optional.of(record));

        notableRecordService.deleteNotableRecord(recordId);
        verify(notableRecordRepository).delete(record);
    }

    @Test
    public void testDeleteNotableRecordUnauthorized() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("otheruser");

        when(notableRecordRepository.findById(recordId)).thenReturn(Optional.of(record));

        assertThrows(UnauthorizedNotableRecordAccessException.class, () -> notableRecordService.deleteNotableRecord(recordId));
    }
}