package com.familytree.service;

import com.familytree.model.Gender;
import com.familytree.model.MemoryBox;
import com.familytree.model.Person;
import com.familytree.model.dto.PersonDTO;
import com.familytree.repository.PersonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PersonServiceTest {

    @Mock
    private PersonRepository personRepository;

    @InjectMocks
    private PersonService personService;

    private Person person;
    private Person spouse;
    private String personId;
    private String spouseId;

    @BeforeEach
    public void setUp() {
        personId = UUID.randomUUID().toString();
        spouseId = UUID.randomUUID().toString();

        person = new Person();
        person.setId(personId);
        person.setName("John Doe");
        person.setGender(Gender.M);
        person.setSpouses(new ArrayList<>(Arrays.asList(spouseId)));

        spouse = new Person();
        spouse.setId(spouseId);
        spouse.setName("Jane Doe");
        spouse.setGender(Gender.F);
        spouse.setSpouses(new ArrayList<>(Arrays.asList(personId)));
    }

    @Test
    public void testGetAllPersons() {
        when(personRepository.findAll()).thenReturn(Arrays.asList(person, spouse));
        var result = personService.getAllPersons();
        assertEquals(2, result.size());
        assertEquals("John Doe", result.get(0).getName());
        assertEquals("Jane Doe", result.get(1).getName());
    }

    @Test
    public void testCreatePerson_Success_GeneratedId() {
        Person newPerson = new Person();
        newPerson.setName("New Person");
        newPerson.setGender(Gender.M);

        when(personRepository.save(any(Person.class))).thenAnswer(invocation -> {
            Person saved = invocation.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(UUID.randomUUID().toString());
            }
            return saved;
        });

        PersonDTO result = personService.createPerson(newPerson);
        assertNotNull(result.getId());
        assertTrue(isValidUUID(result.getId()));
        assertEquals("New Person", result.getName());
        assertEquals(Gender.M, result.getGender());
        assertNotNull(result.getMemoryBox());
    }

    @Test
    public void testCreatePerson_Success_WithIdAndMemoryBox() {
        String customId = UUID.randomUUID().toString();
        Person newPerson = new Person();
        newPerson.setId(customId);
        newPerson.setName("New Person");
        newPerson.setGender(Gender.F);
        MemoryBox memoryBox = new MemoryBox();
        memoryBox.setAvatar("avatar-url");
        newPerson.setMemoryBox(memoryBox);

        when(personRepository.save(any(Person.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PersonDTO result = personService.createPerson(newPerson);
        assertEquals(customId, result.getId());
        assertEquals("New Person", result.getName());
        assertEquals(Gender.F, result.getGender());
        assertNotNull(result.getMemoryBox());
        assertEquals("avatar-url", result.getMemoryBox().getAvatar());
    }

    @Test
    public void testSaveOrUpdatePerson_Success() {
        Person existingPerson = new Person();
        existingPerson.setId(personId);
        existingPerson.setName("Old Name");
        existingPerson.setGender(Gender.M);

        Person updatedPerson = new Person();
        updatedPerson.setName("Updated Name");
        updatedPerson.setGender(Gender.M);
        updatedPerson.setOccupation("Engineer");

        when(personRepository.findById(personId)).thenReturn(Optional.of(existingPerson));
        when(personRepository.save(any(Person.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = personService.saveOrUpdatePerson(personId, updatedPerson);
        assertTrue(result.isPresent());
        PersonDTO updatedDTO = result.get();
        assertEquals("Updated Name", updatedDTO.getName());
        assertEquals(Gender.M, updatedDTO.getGender());
        assertEquals("Engineer", updatedDTO.getOccupation());
    }

    @Test
    public void testSaveOrUpdatePerson_NotFound() {
        Person updatedPerson = new Person();
        updatedPerson.setName("Updated Name");

        when(personRepository.findById(personId)).thenReturn(Optional.empty());

        var result = personService.saveOrUpdatePerson(personId, updatedPerson);
        assertFalse(result.isPresent());
    }

    @Test
    public void testSaveOrUpdatePerson_WithMemoryBoxAvatar() {
        Person existingPerson = new Person();
        existingPerson.setId(personId);
        existingPerson.setName("Old Name");
        existingPerson.setGender(Gender.M);
        existingPerson.setMemoryBox(new MemoryBox());

        Person updatedPerson = new Person();
        updatedPerson.setName("Updated Name");
        MemoryBox memoryBox = new MemoryBox();
        memoryBox.setAvatar("new-avatar-url");
        updatedPerson.setMemoryBox(memoryBox);

        when(personRepository.findById(personId)).thenReturn(Optional.of(existingPerson));
        when(personRepository.save(any(Person.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = personService.saveOrUpdatePerson(personId, updatedPerson);
        assertTrue(result.isPresent());
        PersonDTO updatedDTO = result.get();
        assertEquals("Updated Name", updatedDTO.getName());
        assertEquals("new-avatar-url", updatedDTO.getMemoryBox().getAvatar());
    }

    @Test
    public void testAddChild_Success() {
        Person child = new Person();
        child.setName("Baby Doe");

        when(personRepository.findById(personId)).thenReturn(Optional.of(person));
        when(personRepository.findById(spouseId)).thenReturn(Optional.of(spouse));
        when(personRepository.findByName("Baby Doe")).thenReturn(Optional.empty());
        when(personRepository.save(any(Person.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = personService.addChild(personId, child);
        assertTrue(result.isPresent());
        assertInstanceOf(PersonDTO.class, result.get());
        PersonDTO childDTO = (PersonDTO) result.get();
        assertEquals("Baby Doe", childDTO.getName());
        assertEquals(personId, childDTO.getFatherId());
        assertEquals(spouseId, childDTO.getMotherId());
        assertTrue(isValidUUID(childDTO.getId()));
    }

    @Test
    public void testAddChild_NoSpouse() {
        person.setSpouses(new ArrayList<>());
        when(personRepository.findById(personId)).thenReturn(Optional.of(person));

        Person child = new Person();
        child.setName("Baby Doe");

        var result = personService.addChild(personId, child);
        assertTrue(result.isPresent());
        assertEquals("Cannot add a child without at least one spouse.", result.get());
    }

    @Test
    public void testAddChild_PersonNotFound() {
        Person child = new Person();
        child.setName("Baby Doe");

        when(personRepository.findById(personId)).thenReturn(Optional.empty());

        var result = personService.addChild(personId, child);
        assertFalse(result.isPresent());
    }

    @Test
    public void testAddChild_NameAlreadyExists() {
        Person child = new Person();
        child.setName("Baby Doe");

        Person existingChild = new Person();
        existingChild.setName("Baby Doe");

        when(personRepository.findById(personId)).thenReturn(Optional.of(person));
        when(personRepository.findByName("Baby Doe")).thenReturn(Optional.of(existingChild));

        var result = personService.addChild(personId, child);
        assertTrue(result.isPresent());
        assertEquals("A person with this name already exists.", result.get());
    }

    @Test
    public void testAddSpouse_Success() {
        Person newSpouse = new Person();
        newSpouse.setName("New Spouse");
        newSpouse.setGender(Gender.F);

        when(personRepository.findById(anyString())).thenAnswer(invocation -> {
            String id = invocation.getArgument(0);
            if (id.equals(personId)) {
                return Optional.of(person);
            }
            if (id.equals(spouseId)) {
                return Optional.of(spouse);
            }
            return Optional.empty();
        });
        when(personRepository.save(any(Person.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = personService.addSpouse(personId, newSpouse);
        assertTrue(result.isPresent());
        assertInstanceOf(PersonDTO.class, result.get());
        PersonDTO spouseDTO = (PersonDTO) result.get();
        assertEquals("New Spouse", spouseDTO.getName());
        assertEquals(Gender.F, spouseDTO.getGender());
        assertTrue(person.getSpouses().contains(spouseDTO.getId()));
        assertTrue(spouseDTO.getSpouses().contains(personId));
        assertTrue(isValidUUID(spouseDTO.getId()));
    }

    @Test
    public void testAddSpouse_PersonNotFound() {
        Person newSpouse = new Person();
        newSpouse.setName("New Spouse");

        when(personRepository.findById(personId)).thenReturn(Optional.empty());

        var result = personService.addSpouse(personId, newSpouse);
        assertFalse(result.isPresent());
    }

    @Test
    public void testAddSpouse_SpouseIdAlreadyExists() {
        String existingSpouseId = UUID.randomUUID().toString();
        Person newSpouse = new Person();
        newSpouse.setId(existingSpouseId);
        newSpouse.setName("New Spouse");
        newSpouse.setGender(Gender.F);

        Person existingSpouse = new Person();
        existingSpouse.setId(existingSpouseId);

        when(personRepository.findById(personId)).thenReturn(Optional.of(person));
        when(personRepository.findById(existingSpouseId)).thenReturn(Optional.of(existingSpouse));

        var result = personService.addSpouse(personId, newSpouse);
        assertTrue(result.isPresent());
        assertEquals("Spouse ID already exists.", result.get());
    }

    @Test
    public void testAddSpouse_SameGender() {
        Person newSpouse = new Person();
        newSpouse.setName("New Spouse");
        newSpouse.setGender(Gender.M);

        when(personRepository.findById(anyString())).thenAnswer(invocation -> {
            String id = invocation.getArgument(0);
            if (id.equals(personId)) {
                return Optional.of(person);
            }
            return Optional.empty();
        });

        var result = personService.addSpouse(personId, newSpouse);
        assertTrue(result.isPresent());
        assertEquals("Spouse must be of a different gender.", result.get());
    }

    @Test
    public void testDeletePerson_Success_WithRelationships() {
        String childId = UUID.randomUUID().toString();
        String fatherId = UUID.randomUUID().toString();

        Person child = new Person();
        child.setId(childId);
        child.setFatherId(personId);
        child.setMotherId(spouseId);

        Person father = new Person();
        father.setId(fatherId);
        father.setChildren(new ArrayList<>(Arrays.asList(personId)));

        person.setChildren(new ArrayList<>(Arrays.asList(childId)));
        person.setFatherId(fatherId);

        when(personRepository.findById(personId)).thenReturn(Optional.of(person));
        when(personRepository.findById(spouseId)).thenReturn(Optional.of(spouse));
        when(personRepository.findById(childId)).thenReturn(Optional.of(child));
        when(personRepository.findById(fatherId)).thenReturn(Optional.of(father));
        when(personRepository.save(any(Person.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean result = personService.deletePerson(personId);
        assertTrue(result);
        assertNull(child.getFatherId());
        assertNull(child.getMotherId());
        assertFalse(spouse.getSpouses().contains(personId));
        assertFalse(father.getChildren().contains(personId));
        verify(personRepository).delete(person);
    }

    @Test
    public void testDeletePerson_NotFound() {
        when(personRepository.findById(personId)).thenReturn(Optional.empty());

        boolean result = personService.deletePerson(personId);
        assertFalse(result);
        verify(personRepository, never()).delete(any(Person.class));
    }

    @Test
    public void testDeletePerson_NoRelationships() {
        person.setSpouses(new ArrayList<>());
        person.setChildren(new ArrayList<>());
        person.setFatherId(null);
        person.setMotherId(null);

        when(personRepository.findById(personId)).thenReturn(Optional.of(person));

        boolean result = personService.deletePerson(personId);
        assertTrue(result);
        verify(personRepository).delete(person);
    }

    private boolean isValidUUID(String uuidString) {
        try {
            UUID.fromString(uuidString);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}