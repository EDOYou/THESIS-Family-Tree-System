package com.familytree.controller;

import com.familytree.model.Gender;
import com.familytree.model.MemoryBox;
import com.familytree.model.Person;
import com.familytree.model.dto.PersonDTO;
import com.familytree.repository.PersonRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import javax.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/persons")
@Slf4j
public class PersonController {

    @Autowired
    private PersonRepository personRepository;

    @GetMapping("/all")
    public ResponseEntity<List<PersonDTO>> getAllPersons() {
        List<Person> persons = personRepository.findAll();
        List<PersonDTO> personDTOs = persons.stream().map(PersonDTO::new).collect(Collectors.toList());
        System.out.println("Returning " + personDTOs.size() + " persons: " + personDTOs.stream().map(PersonDTO::getName).collect(Collectors.joining(", ")));
        return ResponseEntity.ok(personDTOs);
    }

    @GetMapping("/root")
    public ResponseEntity<PersonDTO> getFamilyTree() {
        return personRepository.findFirstByFatherIdIsNullAndMotherIdIsNull()
                .map(person -> ResponseEntity.ok(new PersonDTO(person)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<PersonDTO> createPerson(@Valid @RequestBody Person person) {
        System.out.println("Creating person: " + person.getName() + ", ID: " + person.getId());
        if (person.getId() == null) {
            person.setId(UUID.randomUUID().toString());
        }
        if (person.getSpouses() == null) person.setSpouses(new ArrayList<>());
        if (person.getChildren() == null) person.setChildren(new ArrayList<>());
        if (person.getMemoryBox() == null) {
            person.setMemoryBox(new MemoryBox());
        }
        person.getMemoryBox().setPerson(person);

        Person savedPerson = personRepository.save(person);
        return ResponseEntity.ok(new PersonDTO(savedPerson));
    }

    @PutMapping("/{personId}")
    @Transactional
    public ResponseEntity<PersonDTO> saveOrUpdatePerson(@PathVariable String personId, @Valid @RequestBody Person person) {
        System.out.println("Updating person: " + person.getName() + ", ID: " + person.getId());
        return personRepository.findById(personId)
                .map(existingPerson -> {
                    existingPerson.setName(person.getName());
                    existingPerson.setGender(person.getGender());
                    existingPerson.setOccupation(person.getOccupation());
                    existingPerson.setAge(person.getAge());
                    existingPerson.setBirthDate(person.getBirthDate());
                    existingPerson.setDeathDate(person.getDeathDate());
                    existingPerson.setBirthPlace(person.getBirthPlace());
                    existingPerson.setDeathPlace(person.getDeathPlace());
                    existingPerson.setHasSubTree(person.isHasSubTree());
                    existingPerson.setFatherId(person.getFatherId());
                    existingPerson.setMotherId(person.getMotherId());

                    MemoryBox existingMemoryBox = existingPerson.getMemoryBox();
                    if (existingMemoryBox == null) {
                        existingMemoryBox = new MemoryBox();
                        existingPerson.setMemoryBox(existingMemoryBox);
                        existingMemoryBox.setPerson(existingPerson);
                    }

                    if (person.getMemoryBox() != null && person.getMemoryBox().getAvatar() != null) {
                        existingMemoryBox.setAvatar(person.getMemoryBox().getAvatar());
                    }

                    if (person.getSpouses() != null) {
                        existingPerson.setSpouses(person.getSpouses());
                    } else {
                        existingPerson.setSpouses(new ArrayList<>());
                    }
                    if (person.getChildren() != null) {
                        existingPerson.setChildren(person.getChildren());
                    } else {
                        existingPerson.setChildren(new ArrayList<>());
                    }

                    Person savedPerson = personRepository.save(existingPerson);
                    return ResponseEntity.ok(new PersonDTO(savedPerson));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{personId}/child")
    @Transactional
    public ResponseEntity<?> addChild(@PathVariable String personId, @Valid @RequestBody Person child) {
        log.info("Adding child to person with ID: {}, Child name: {}", personId, child.getName());
        return personRepository.findById(personId)
                .map(person -> {
                    if (child.getId() == null) {
                        child.setId(UUID.randomUUID().toString());
                    }
                    if (person.getSpouses().isEmpty()) {
                        log.warn("Cannot add a child to person with ID: {} without at least one spouse.", personId);
                        return ResponseEntity.badRequest().body("Cannot add a child without at least one spouse.");
                    }
                    if (personRepository.findByName(child.getName()).isPresent()) {
                        log.warn("A person with name {} already exists.", child.getName());
                        return ResponseEntity.badRequest().body("A person with this name already exists.");
                    }
                    child.setSpouses(new ArrayList<>());
                    child.setChildren(new ArrayList<>());

                    MemoryBox memoryBox = new MemoryBox();
                    memoryBox.setPerson(child);
                    child.setMemoryBox(memoryBox);

                    if (child.getMemoryBox() != null && child.getMemoryBox().getAvatar() != null) {
                        String avatarUrl = child.getMemoryBox().getAvatar();
                        memoryBox.setAvatar(avatarUrl);
                        log.info("Set avatar for child's MemoryBox: {}", avatarUrl);
                    }

                    Person savedChild = personRepository.save(child);
                    log.info("Saved child with ID: {}, MemoryBox ID: {}, Avatar: {}",
                            savedChild.getId(), savedChild.getMemoryBox().getId(), savedChild.getMemoryBox().getAvatar());
                    person.addChild(savedChild.getId());

                    String spouseId = person.getSpouses().stream().findFirst().orElse(null);
                    if (spouseId != null) {
                        Person spouse = personRepository.findById(spouseId).orElse(null);
                        if (spouse != null && spouse.getGender() == Gender.F) {
                            savedChild.setMotherId(spouseId);
                            savedChild.setFatherId(person.getId());
                        } else {
                            savedChild.setFatherId(spouseId);
                            savedChild.setMotherId(person.getId());
                        }
                        personRepository.save(savedChild);
                        log.info("Updated child with ID: {}, Father ID: {}, Mother ID: {}",
                                savedChild.getId(), savedChild.getFatherId(), savedChild.getMotherId());
                    } else {
                        savedChild.setFatherId(person.getId());
                        personRepository.save(savedChild);
                        log.info("Updated child with ID: {}, Father ID: {}", savedChild.getId(), savedChild.getFatherId());
                    }
                    personRepository.save(person);
                    log.info("Updated person with ID: {} with new child ID: {}", person.getId(), savedChild.getId());
                    return ResponseEntity.ok(new PersonDTO(savedChild));
                })
                .orElseGet(() -> {
                    log.warn("Person with ID: {} not found.", personId);
                    return ResponseEntity.notFound().build();
                });
    }

    @PostMapping("/{personId}/spouse")
    @Transactional
    public ResponseEntity<?> addSpouse(@PathVariable String personId, @Valid @RequestBody Person spouse) {
        log.info("Adding spouse to person with ID: {}, Spouse name: {}, Gender: {}",
                personId, spouse.getName(), spouse.getGender());
        log.info("Received spouse: {}", spouse);
        return personRepository.findById(personId)
                .map(person -> {
                    if (spouse.getId() == null || spouse.getId().trim().isEmpty()) {
                        spouse.setId(UUID.randomUUID().toString());
                    } else if (personRepository.findById(spouse.getId()).isPresent()) {
                        log.warn("Spouse with ID: {} already exists.", spouse.getId());
                        return ResponseEntity.badRequest().body("Spouse ID already exists.");
                    }

                    if (person.getGender() == spouse.getGender()) {
                        log.warn("Spouse must be of a different gender. Person gender: {}, Spouse gender: {}",
                                person.getGender(), spouse.getGender());
                        return ResponseEntity.badRequest().body("Spouse must be of a different gender.");
                    }

                    if (spouse.getSpouses() == null) spouse.setSpouses(new ArrayList<>());
                    if (spouse.getChildren() == null) spouse.setChildren(new ArrayList<>());
                    if (person.getSpouses() == null) person.setSpouses(new ArrayList<>());

                    MemoryBox memoryBox = new MemoryBox();
                    memoryBox.setPerson(spouse);
                    spouse.setMemoryBox(memoryBox);

                    if (spouse.getMemoryBox() != null && spouse.getMemoryBox().getAvatar() != null) {
                        String avatarUrl = spouse.getMemoryBox().getAvatar();
                        memoryBox.setAvatar(avatarUrl);
                        log.info("Set avatar for spouse's MemoryBox: {}", avatarUrl);
                    }

                    Person savedSpouse = personRepository.save(spouse);
                    log.info("Saved spouse with ID: {}, MemoryBox ID: {}, Avatar: {}",
                            savedSpouse.getId(), savedSpouse.getMemoryBox().getId(), savedSpouse.getMemoryBox().getAvatar());

                    person.addSpouse(savedSpouse.getId());
                    savedSpouse.addSpouse(person.getId());

                    personRepository.save(person);
                    personRepository.save(savedSpouse);
                    log.info("Updated person with ID: {} and spouse with ID: {} with mutual spouse relationship.",
                            person.getId(), savedSpouse.getId());

                    return ResponseEntity.ok(new PersonDTO(savedSpouse));
                })
                .orElseGet(() -> {
                    log.warn("Person with ID: {} not found.", personId);
                    return ResponseEntity.notFound().build();
                });
    }

    @DeleteMapping("/{personId}")
    @Transactional
    public ResponseEntity<?> deletePerson(@PathVariable String personId) {
        return personRepository.findById(personId)
                .map(person -> {
                    person.getSpouses().forEach(spouseId -> {
                        Person spouse = personRepository.findById(spouseId).orElse(null);
                        if (spouse != null) {
                            spouse.removeSpouse(personId);
                            personRepository.save(spouse);
                        }
                    });
                    person.getChildren().forEach(childId -> {
                        Person child = personRepository.findById(childId).orElse(null);
                        if (child != null) {
                            child.setFatherId(null);
                            child.setMotherId(null);
                            personRepository.save(child);
                        }
                    });
                    if (person.getFatherId() != null) {
                        Person father = personRepository.findById(person.getFatherId()).orElse(null);
                        if (father != null) {
                            father.removeChild(personId);
                            personRepository.save(father);
                        }
                    }
                    if (person.getMotherId() != null) {
                        Person mother = personRepository.findById(person.getMotherId()).orElse(null);
                        if (mother != null) {
                            mother.removeChild(personId);
                            personRepository.save(mother);
                        }
                    }
                    personRepository.delete(person);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}