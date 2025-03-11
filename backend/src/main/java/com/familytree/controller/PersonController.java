package com.familytree.controller;

import com.familytree.model.Person;
import com.familytree.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

@RestController
@RequestMapping("/api/persons")
public class PersonController {

    @Autowired
    private PersonRepository personRepository;

    @GetMapping("/{id}")
    public ResponseEntity<Person> getPersonById(@PathVariable Long id) {
        return personRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Person createPerson(@RequestBody Person person) {
        return personRepository.save(person);
    }

    @GetMapping("/tree")
    public ResponseEntity<Person> getFamilyTree() {
        return personRepository.findById(1L)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Person> updatePerson(@PathVariable Long id, @RequestBody Person updatedPerson) {
        return personRepository.findById(id)
                .map(existingPerson -> {
                    existingPerson.setName(updatedPerson.getName());
                    existingPerson.setGender(updatedPerson.getGender());
                    existingPerson.setOccupation(updatedPerson.getOccupation());
                    existingPerson.setAge(updatedPerson.getAge());
                    existingPerson.setBirthDate(updatedPerson.getBirthDate());
                    existingPerson.setDeathDate(updatedPerson.getDeathDate());
                    existingPerson.setBirthPlace(updatedPerson.getBirthPlace());
                    existingPerson.setDeathPlace(updatedPerson.getDeathPlace());
                    existingPerson.setHasSubTree(updatedPerson.getHasSubTree());

                    if (updatedPerson.getSpouse() != null) {
                        existingPerson.setSpouse(updatedPerson.getSpouse());
                    }
                    if (updatedPerson.getParent() != null) {
                        existingPerson.setParent(updatedPerson.getParent());
                    }

                    Set<Person> updatedChildren = new HashSet<>(updatedPerson.getChildren() != null ? updatedPerson.getChildren() : new ArrayList<>());
                    existingPerson.getChildren().clear();
                    existingPerson.getChildren().addAll(updatedChildren);

                    return ResponseEntity.ok(personRepository.save(existingPerson));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
