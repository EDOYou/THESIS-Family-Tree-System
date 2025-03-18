package com.familytree.controller;

import com.familytree.model.Person;
import com.familytree.model.dto.PersonDTO;
import com.familytree.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/persons")
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
        return personRepository.findFirstByParentIsNull()
                .map(person -> ResponseEntity.ok(new PersonDTO(person)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PersonDTO> createPerson(@Valid @RequestBody Person person) {
        System.out.println("Creating person: " + person.getName() + ", ID: " + person.getId());
        if (person.getId() == null) {
            person.setId(UUID.randomUUID().toString());
        }
        person.setChildren(new ArrayList<>());
        Person savedPerson = personRepository.save(person);
        return ResponseEntity.ok(new PersonDTO(savedPerson));
    }

    @PutMapping("/{personId}")
    public PersonDTO saveOrUpdatePerson(@PathVariable String personId, @Valid @RequestBody Person person) {
        System.out.println("Updating person: " + person.getName() + ", ID: " + person.getId());
        person.setId(personId);
        Person savedPerson = personRepository.save(person);
        return new PersonDTO(savedPerson);
    }

    @PostMapping("/{personId}/child")
    public ResponseEntity<?> addChild(@PathVariable String personId, @Valid @RequestBody Person child) {
        return personRepository.findById(personId)
                .map(person -> {
                    if (person.getSpouse() == null) {
                        return ResponseEntity.badRequest().body("Cannot add a child without a spouse.");
                    }
                    if (personRepository.findByName(child.getName()).isPresent()) {
                        return ResponseEntity.badRequest().body("A person with this name already exists.");
                    }
                    if (child.getId() == null) {
                        throw new IllegalArgumentException("ID must be provided for new child");
                    }
                    child.setParent(person);
                    child.setChildren(new ArrayList<>());
                    Person savedChild = personRepository.save(child);
                    person.getChildren().add(savedChild);
                    personRepository.save(person);
                    return ResponseEntity.ok(new PersonDTO(savedChild));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{personId}/spouse")
    public ResponseEntity<?> addSpouse(@PathVariable String personId, @Valid @RequestBody Person spouse) {
        System.out.println("Received spouse: " + spouse.getName() + ", Gender: " + spouse.getGender());
        return personRepository.findById(personId)
                .map(person -> {
                    if (person.getSpouse() != null) {
                        return ResponseEntity.badRequest().body("Person already has a spouse.");
                    }
                    if (person.getGender() == spouse.getGender()) {
                        return ResponseEntity.badRequest().body("Spouse must be of a different gender.");
                    }
                    if (personRepository.findByName(spouse.getName()).isPresent()) {
                        return ResponseEntity.badRequest().body("A person with this name already exists.");
                    }
                    if (spouse.getId() == null) {
                        throw new IllegalArgumentException("ID must be provided for new spouse");
                    }
                    spouse.setSpouse(null);
                    spouse.setChildren(new ArrayList<>());
                    Person savedSpouse = personRepository.save(spouse);
                    person.setSpouse(savedSpouse);
                    Person savedPerson = personRepository.save(person);
                    savedSpouse.setSpouse(savedPerson);
                    personRepository.save(savedSpouse);
                    return ResponseEntity.ok(new PersonDTO(savedSpouse));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}