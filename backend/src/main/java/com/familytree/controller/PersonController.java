package com.familytree.controller;

import com.familytree.model.Person;
import com.familytree.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/persons")
public class PersonController {

    @Autowired
    private PersonRepository personRepository;

    @GetMapping("/root")
    public ResponseEntity<Person> getFamilyTree() {
        return personRepository.findByParentIsNull()
                .map(person -> ResponseEntity.ok(person))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Person createPerson(@Valid @RequestBody Person person) {
        System.out.println("Creating person: " + person.getName() + ", ID: " + person.getId());
        if (person.getId() != null) {
            person.setId(null);
        }
        return personRepository.save(person);
    }

    @PutMapping("/{personId}")
    public Person saveOrUpdatePerson(@PathVariable Long personId, @Valid @RequestBody Person person) {
        System.out.println("Updating person: " + person.getName() + ", ID: " + person.getId());
        person.setId(personId);
        return personRepository.save(person);
    }

    @PostMapping("/{personId}/child")
    public ResponseEntity<?> addChild(@PathVariable Long personId, @Valid @RequestBody Person child) {
        return personRepository.findById(personId)
                .map(person -> {
                    if (person.getSpouse() == null) {
                        return ResponseEntity.badRequest().body("Cannot add a child without a spouse.");
                    }
                    if (personRepository.findByName(child.getName()).isPresent()) {
                        return ResponseEntity.badRequest().body("A person with this name already exists.");
                    }
                    child.setParent(person);
                    Person savedChild = personRepository.save(child);
                    person.getChildren().add(savedChild);
                    personRepository.save(person);
                    return ResponseEntity.ok(savedChild);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{personId}/spouse")
    public ResponseEntity<?> addSpouse(@PathVariable Long personId, @Valid @RequestBody Person spouse) {
        System.out.println("Received spouse: " + spouse.getId() + ", " + spouse.getName() + ", " + spouse.getGender());
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
                    spouse.setSpouse(null);
                    spouse.setParent(null);
                    spouse.setChildren(new ArrayList<>());
                    if (spouse.getId() != null) {
                        System.out.println("Warning: Spouse ID is not null (" + spouse.getId() + "). Resetting to null for new entity.");
                        spouse.setId(null);
                    }
                    Person savedSpouse = personRepository.save(spouse);
                    System.out.println("Saved spouse ID: " + savedSpouse.getId());
                    person.setSpouse(savedSpouse);
                    Person savedPerson = personRepository.save(person);
                    savedSpouse.setSpouse(savedPerson);
                    personRepository.save(savedSpouse);
                    return ResponseEntity.ok(savedSpouse);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}