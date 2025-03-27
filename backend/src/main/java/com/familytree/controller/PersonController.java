package com.familytree.controller;

import com.familytree.model.Gender;
import com.familytree.model.Person;
import com.familytree.model.dto.PersonDTO;
import com.familytree.repository.PersonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.io.IOException;
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
        return personRepository.findFirstByFatherIdIsNullAndMotherIdIsNull()
                .map(person -> ResponseEntity.ok(new PersonDTO(person)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PersonDTO> createPerson(@Valid @RequestBody Person person) {
        System.out.println("Creating person: " + person.getName() + ", ID: " + person.getId());
        if (person.getId() == null) {
            person.setId(UUID.randomUUID().toString());
        }
        if (person.getSpouses() == null) person.setSpouses(new ArrayList<>());
        if (person.getChildren() == null) person.setChildren(new ArrayList<>());
        Person savedPerson = personRepository.save(person);
        return ResponseEntity.ok(new PersonDTO(savedPerson));
    }

    @PutMapping("/{personId}")
    public ResponseEntity<PersonDTO> saveOrUpdatePerson(@PathVariable String personId, @Valid @RequestBody Person person) {
        System.out.println("Updating person: " + person.getName() + ", ID: " + person.getId());
        person.setId(personId);
        if (person.getSpouses() == null) person.setSpouses(new ArrayList<>());
        if (person.getChildren() == null) person.setChildren(new ArrayList<>());
        Person savedPerson = personRepository.save(person);
        return ResponseEntity.ok(new PersonDTO(savedPerson));
    }

    @PostMapping("/{personId}/child")
    public ResponseEntity<?> addChild(@PathVariable String personId, @Valid @RequestBody Person child) {
        return personRepository.findById(personId)
                .map(person -> {
                    if (child.getId() == null) {
                        child.setId(UUID.randomUUID().toString());
                    }
                    if (person.getSpouses().isEmpty()) {
                        return ResponseEntity.badRequest().body("Cannot add a child without at least one spouse.");
                    }
                    if (personRepository.findByName(child.getName()).isPresent()) {
                        return ResponseEntity.badRequest().body("A person with this name already exists.");
                    }
                    child.setSpouses(new ArrayList<>());
                    child.setChildren(new ArrayList<>());
                    Person savedChild = personRepository.save(child);
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
                    } else {
                        savedChild.setFatherId(person.getId());
                        personRepository.save(savedChild);
                    }
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
                    System.out.println("==========================================================================================================\n====================================================");
                    if (spouse.getId() == null || spouse.getId().trim().isEmpty()) {
                        spouse.setId(UUID.randomUUID().toString());
                    } else if (personRepository.findById(spouse.getId()).isPresent()) {
                        return ResponseEntity.badRequest().body("Spouse ID already exists.");
                    }

                    if (person.getGender() == spouse.getGender()) {
                        return ResponseEntity.badRequest().body("Spouse must be of a different gender.");
                    }

                    if (spouse.getSpouses() == null) spouse.setSpouses(new ArrayList<>());
                    if (spouse.getChildren() == null) spouse.setChildren(new ArrayList<>());
                    if (person.getSpouses() == null) person.setSpouses(new ArrayList<>());

                    Person savedSpouse = personRepository.save(spouse);

                    person.addSpouse(savedSpouse.getId());
                    savedSpouse.addSpouse(person.getId());

                    personRepository.save(person);
                    personRepository.save(savedSpouse);

                    System.out.println("END ........");
                    return ResponseEntity.ok(new PersonDTO(savedSpouse));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{personId}")
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

    @PostMapping("/{personId}/memory-box")
    public ResponseEntity<PersonDTO> uploadMemoryBox(
            @PathVariable String personId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return personRepository.findById(personId)
                .map(person -> {
                    try {
                        person.setMemoryBoxFile(file.getBytes());
                        person.setMemoryBoxFilename(file.getOriginalFilename());
                        person.setMemoryBoxContentType(file.getContentType());
                        Person savedPerson = personRepository.save(person);
                        return ResponseEntity.ok(new PersonDTO(savedPerson));
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to upload file", e);
                    }
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{personId}/memory-box")
    public ResponseEntity<?> getMemoryBox(@PathVariable String personId) {
        return personRepository.findById(personId)
                .map(person -> {
                    if (person.getMemoryBoxFile() == null) {
                        return ResponseEntity.noContent().build();
                    }
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType(person.getMemoryBoxContentType()));
                    headers.setContentDispositionFormData("attachment", person.getMemoryBoxFilename());
                    return ResponseEntity.ok()
                            .headers(headers)
                            .body(person.getMemoryBoxFile());
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
