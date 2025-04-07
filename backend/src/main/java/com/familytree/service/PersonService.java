package com.familytree.service;

import com.familytree.model.Gender;
import com.familytree.model.Person;
import com.familytree.model.dto.PersonDTO;
import com.familytree.repository.PersonRepository;
import com.familytree.utils.PersonUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PersonService implements PersonServiceInterface {

    private final PersonRepository personRepository;

    public PersonService(PersonRepository personRepository) {
        this.personRepository = personRepository;
    }

    @Override
    public List<PersonDTO> getAllPersons() {
        List<Person> persons = personRepository.findAll();
        log.info("Returning {} persons: {}", persons.size(),
                persons.stream().map(Person::getName).collect(Collectors.joining(", ")));
        return persons.stream().map(PersonDTO::new).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PersonDTO createPerson(Person person) {
        log.info("Creating person: {}, ID: {}", person.getName(), person.getId());
        PersonUtils.initializePerson(person);
        Person savedPerson = personRepository.save(person);
        return new PersonDTO(savedPerson);
    }

    @Override
    @Transactional
    public Optional<PersonDTO> saveOrUpdatePerson(String personId, Person person) {
        log.info("Updating person: {}, ID: {}", person.getName(), person.getId());
        Optional<Person> existingPersonOpt = PersonUtils.fetchPerson(personRepository, personId);
        if (existingPersonOpt.isEmpty()) {
            return Optional.empty();
        }

        Person existingPerson = existingPersonOpt.get();
        existingPerson.setName(person.getName());
        existingPerson.setGender(person.getGender());
        existingPerson.setOccupation(person.getOccupation());
        existingPerson.setAge(person.getAge());
        existingPerson.setBirthDate(person.getBirthDate());
        existingPerson.setDeathDate(person.getDeathDate());
        existingPerson.setBirthPlace(person.getBirthPlace());
        existingPerson.setDeathPlace(person.getDeathPlace());
        existingPerson.setFatherId(person.getFatherId());
        existingPerson.setMotherId(person.getMotherId());

        if (existingPerson.getMemoryBox() == null) {
            PersonUtils.initializePerson(existingPerson);
        }
        PersonUtils.updateMemoryBoxAvatar(existingPerson.getMemoryBox(), person.getMemoryBox(), "Updated avatar for person's MemoryBox: {}");

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
        return Optional.of(new PersonDTO(savedPerson));
    }

    @Override
    @Transactional
    public Optional<?> addChild(String personId, Person child) {
        log.info("Adding child to person with ID: {}, Child name: {}", personId, child.getName());
        Optional<Person> personOpt = PersonUtils.fetchPerson(personRepository, personId);
        if (personOpt.isEmpty()) {
            return Optional.empty();
        }

        Person person = personOpt.get();
        if (person.getSpouses().isEmpty()) {
            log.warn("Cannot add a child to person with ID: {} without at least one spouse.", personId);
            return Optional.of("Cannot add a child without at least one spouse.");
        }
        if (personRepository.findByName(child.getName()).isPresent()) {
            log.warn("A person with name {} already exists.", child.getName());
            return Optional.of("A person with this name already exists.");
        }

        PersonUtils.initializePerson(child);
        PersonUtils.updateMemoryBoxAvatar(child.getMemoryBox(), child.getMemoryBox(), "Set avatar for child's MemoryBox: {}");

        Person savedChild = personRepository.save(child);
        log.info("Saved child with ID: {}, MemoryBox ID: {}, Avatar: {}",
                savedChild.getId(), savedChild.getMemoryBox().getId(), savedChild.getMemoryBox().getAvatar());
        person.addChild(savedChild.getId());

        String spouseId = person.getSpouses().stream().findFirst().orElse(null);
        if (spouseId != null) {
            Optional<Person> spouseOpt = PersonUtils.fetchPerson(personRepository, spouseId);
            Person spouse = spouseOpt.orElse(null);
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
        return Optional.of(new PersonDTO(savedChild));
    }

    @Override
    @Transactional
    public Optional<?> addSpouse(String personId, Person spouse) {
        log.info("Adding spouse to person with ID: {}, Spouse name: {}, Gender: {}",
                personId, spouse.getName(), spouse.getGender());
        Optional<Person> personOpt = PersonUtils.fetchPerson(personRepository, personId);
        if (personOpt.isEmpty()) {
            return Optional.empty();
        }

        Person person = personOpt.get();
        if (spouse.getId() == null || spouse.getId().trim().isEmpty()) {
            spouse.setId(UUID.randomUUID().toString());
        } else if (personRepository.findById(spouse.getId()).isPresent()) {
            log.warn("Spouse with ID: {} already exists.", spouse.getId());
            return Optional.of("Spouse ID already exists.");
        }

        if (person.getGender() == spouse.getGender()) {
            log.warn("Spouse must be of a different gender. Person gender: {}, Spouse gender: {}",
                    person.getGender(), spouse.getGender());
            return Optional.of("Spouse must be of a different gender.");
        }

        PersonUtils.initializePerson(spouse);
        PersonUtils.updateMemoryBoxAvatar(spouse.getMemoryBox(), spouse.getMemoryBox(), "Set avatar for spouse's MemoryBox: {}");

        Person savedSpouse = personRepository.save(spouse);
        log.info("Saved spouse with ID: {}, MemoryBox ID: {}, Avatar: {}",
                savedSpouse.getId(), savedSpouse.getMemoryBox().getId(), savedSpouse.getMemoryBox().getAvatar());

        person.addSpouse(savedSpouse.getId());
        savedSpouse.addSpouse(person.getId());

        personRepository.save(person);
        personRepository.save(savedSpouse);
        log.info("Updated person with ID: {} and spouse with ID: {} with mutual spouse relationship.",
                person.getId(), savedSpouse.getId());

        return Optional.of(new PersonDTO(savedSpouse));
    }

    @Override
    @Transactional
    public boolean deletePerson(String personId) {
        Optional<Person> personOpt = PersonUtils.fetchPerson(personRepository, personId);
        if (personOpt.isEmpty()) {
            return false;
        }

        Person person = personOpt.get();
        person.getSpouses().forEach(spouseId -> {
            Optional<Person> spouseOpt = PersonUtils.fetchPerson(personRepository, spouseId);
            Person spouse = spouseOpt.orElse(null);
            if (spouse != null) {
                spouse.removeSpouse(personId);
                personRepository.save(spouse);
            }
        });
        person.getChildren().forEach(childId -> {
            Optional<Person> childOpt = PersonUtils.fetchPerson(personRepository, childId);
            Person child = childOpt.orElse(null);
            if (child != null) {
                child.setFatherId(null);
                child.setMotherId(null);
                personRepository.save(child);
            }
        });
        if (person.getFatherId() != null) {
            Optional<Person> fatherOpt = PersonUtils.fetchPerson(personRepository, person.getFatherId());
            Person father = fatherOpt.orElse(null);
            if (father != null) {
                father.removeChild(personId);
                personRepository.save(father);
            }
        }
        if (person.getMotherId() != null) {
            Optional<Person> motherOpt = PersonUtils.fetchPerson(personRepository, person.getMotherId());
            Person mother = motherOpt.orElse(null);
            if (mother != null) {
                mother.removeChild(personId);
                personRepository.save(mother);
            }
        }
        personRepository.delete(person);
        return true;
    }
}