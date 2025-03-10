package com.familytree.controller;

import com.familytree.dto.PersonDTO;
import com.familytree.model.Person;
import com.familytree.repository.PersonRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3008")
@RestController
@RequestMapping("/api/persons")
@Slf4j
public class FamilyTreeController {

    @Autowired
    private PersonRepository personRepository;

    @GetMapping
    public List<Person> getAllPersons() {
        log.info("Handling GET request for /api/persons");
        return personRepository.findAll();
    }

    @PostMapping
    public Person addPerson(@RequestBody PersonDTO personDTO) {
        log.info("Handling POST request for /api/persons with DTO: {}", personDTO);
        Person person = new Person();
        person.setName(personDTO.getName());
        if (personDTO.getParentId() != null) {
            Person parent = personRepository.findById(personDTO.getParentId())
                    .orElseThrow(() -> new RuntimeException("Parent not found"));
            person.setParent(parent);
        }
        return personRepository.save(person);
    }
}