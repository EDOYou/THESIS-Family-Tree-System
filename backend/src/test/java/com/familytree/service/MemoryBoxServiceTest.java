package com.familytree.service;

import com.familytree.exception.InvalidMemoryBoxException;
import com.familytree.exception.MemoryBoxNotFoundException;
import com.familytree.exception.PersonNotFoundException;
import com.familytree.model.MemoryBox;
import com.familytree.model.Person;
import com.familytree.repository.MemoryBoxRepository;
import com.familytree.repository.PersonRepository;
import com.familytree.utils.PersonUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MemoryBoxServiceTest {

    @Mock
    private MemoryBoxRepository memoryBoxRepository;

    @Mock
    private PersonRepository personRepository;

    @InjectMocks
    private MemoryBoxService memoryBoxService;

    private MemoryBox memoryBox;
    private Person person;
    private String memoryBoxId;
    private String personId;

    @BeforeEach
    public void setUp() {
        personId = UUID.randomUUID().toString();

        person = new Person();
        person.setId(personId);
        person.setName("John Doe");

        PersonUtils.initializePerson(person);

        memoryBox = person.getMemoryBox();
        memoryBoxId = memoryBox.getId();
        memoryBox.setAvatar("https://example.com/avatar.png");
    }

    @Test
    public void testGetAllMemoryBoxesSuccess() {
        when(memoryBoxRepository.findAll()).thenReturn(Arrays.asList(memoryBox));

        var result = memoryBoxService.getAllMemoryBoxes();
        assertEquals(1, result.size());
        assertEquals(memoryBoxId, result.get(0).getId());
        assertEquals("https://example.com/avatar.png", result.get(0).getAvatar());
    }

    @Test
    public void testGetMemoryBoxByIdSuccess() {
        when(memoryBoxRepository.findById(memoryBoxId)).thenReturn(Optional.of(memoryBox));

        MemoryBox result = memoryBoxService.getMemoryBoxById(memoryBoxId);
        assertEquals(memoryBoxId, result.getId());
        assertEquals("https://example.com/avatar.png", result.getAvatar());
    }

    @Test
    public void testGetMemoryBoxByIdNotFound() {
        when(memoryBoxRepository.findById(memoryBoxId)).thenReturn(Optional.empty());

        assertThrows(MemoryBoxNotFoundException.class, () -> memoryBoxService.getMemoryBoxById(memoryBoxId));
    }

    @Test
    public void testGetMemoryBoxByPersonIdSuccess() {
        when(personRepository.findById(personId)).thenReturn(Optional.of(person));

        MemoryBox result = memoryBoxService.getMemoryBoxByPersonId(personId);
        assertEquals(memoryBoxId, result.getId());
        assertEquals("https://example.com/avatar.png", result.getAvatar());
    }

    @Test
    public void testGetMemoryBoxByPersonIdPersonNotFound() {
        when(personRepository.findById(personId)).thenReturn(Optional.empty());

        assertThrows(PersonNotFoundException.class, () -> memoryBoxService.getMemoryBoxByPersonId(personId));
    }

    @Test
    public void testCreateMemoryBoxPersonNotFound() {
        when(personRepository.findById(personId)).thenReturn(Optional.empty());

        assertThrows(PersonNotFoundException.class, () -> memoryBoxService.createMemoryBox(personId, memoryBox));
    }

    @Test
    public void testCreateMemoryBoxAlreadyHasMemoryBox() {
        when(personRepository.findById(personId)).thenReturn(Optional.of(person));

        assertThrows(InvalidMemoryBoxException.class, () -> memoryBoxService.createMemoryBox(personId, memoryBox));
    }

    @Test
    public void testCreateMemoryBoxInvalidAvatarUrl() {
        Person newPerson = new Person();
        newPerson.setId(UUID.randomUUID().toString());
        newPerson.setName("Jane Doe");

        MemoryBox newMemoryBox = new MemoryBox();
        newMemoryBox.setId(UUID.randomUUID().toString());
        newMemoryBox.setAvatar("invalid-url");

        when(personRepository.findById(newPerson.getId())).thenReturn(Optional.of(newPerson));

        assertThrows(InvalidMemoryBoxException.class, () -> memoryBoxService.createMemoryBox(newPerson.getId(), newMemoryBox));
    }

    @Test
    public void testUpdateAvatarSuccess() {
        when(memoryBoxRepository.findById(memoryBoxId)).thenReturn(Optional.of(memoryBox));
        when(memoryBoxRepository.saveAndFlush(any(MemoryBox.class))).thenReturn(memoryBox);

        MemoryBox result = memoryBoxService.updateAvatar(memoryBoxId, "\"https://example.com/new-avatar.png\"");
        assertEquals("https://example.com/new-avatar.png", result.getAvatar());
    }

    @Test
    public void testUpdateAvatarNotFound() {
        when(memoryBoxRepository.findById(memoryBoxId)).thenReturn(Optional.empty());

        assertThrows(MemoryBoxNotFoundException.class, () -> memoryBoxService.updateAvatar(memoryBoxId, "https://example.com/new-avatar.png"));
    }

    @Test
    public void testDeleteMemoryBoxSuccess() {
        when(memoryBoxRepository.findById(memoryBoxId)).thenReturn(Optional.of(memoryBox));
        when(personRepository.save(any(Person.class))).thenReturn(person);

        memoryBoxService.deleteMemoryBox(memoryBoxId);
        verify(memoryBoxRepository).delete(memoryBox);
        assertNull(person.getMemoryBox());
    }

    @Test
    public void testDeleteMemoryBoxNotFound() {
        when(memoryBoxRepository.findById(memoryBoxId)).thenReturn(Optional.empty());

        assertThrows(MemoryBoxNotFoundException.class, () -> memoryBoxService.deleteMemoryBox(memoryBoxId));
    }
}