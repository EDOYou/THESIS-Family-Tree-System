package com.familytree.controller;

import com.familytree.model.Person;
import com.familytree.model.dto.PersonDTO;
import com.familytree.service.PersonService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/persons")
@Slf4j
public class PersonController {

    private final PersonService personService;

    public PersonController(PersonService personService) {
        this.personService = personService;
    }

    @GetMapping("/all")
    public ResponseEntity<List<PersonDTO>> getAllPersons() {
        List<PersonDTO> personDTOs = personService.getAllPersons();
        return ResponseEntity.ok(personDTOs);
    }

    @PostMapping
    public ResponseEntity<PersonDTO> createPerson(@Valid @RequestBody Person person) {
        PersonDTO personDTO = personService.createPerson(person);
        return ResponseEntity.ok(personDTO);
    }

    @PutMapping("/{personId}")
    public ResponseEntity<PersonDTO> saveOrUpdatePerson(@PathVariable String personId, @Valid @RequestBody Person person) {
        return personService.saveOrUpdatePerson(personId, person)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{personId}/child")
    public ResponseEntity<?> addChild(@PathVariable String personId, @Valid @RequestBody Person child) {
        return personService.addChild(personId, child)
                .map(result -> {
                    if (result instanceof PersonDTO) {
                        return ResponseEntity.ok(result);
                    } else {
                        return ResponseEntity.badRequest().body(result);
                    }
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{personId}/spouse")
    public ResponseEntity<?> addSpouse(@PathVariable String personId, @Valid @RequestBody Person spouse) {
        return personService.addSpouse(personId, spouse)
                .map(result -> {
                    if (result instanceof PersonDTO) {
                        return ResponseEntity.ok(result);
                    } else {
                        return ResponseEntity.badRequest().body(result);
                    }
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{personId}")
    public ResponseEntity<?> deletePerson(@PathVariable String personId) {
        boolean deleted = personService.deletePerson(personId);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
}