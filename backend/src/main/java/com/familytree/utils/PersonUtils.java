package com.familytree.utils;

import com.familytree.model.MemoryBox;
import com.familytree.model.Person;
import com.familytree.repository.PersonRepository;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

@Slf4j
public class PersonUtils {

    /**
     * Initializes a Person object with default values if necessary.
     *
     * @param person The Person object to initialize.
     */
    public static void initializePerson(Person person) {
        if (person.getId() == null) {
            person.setId(UUID.randomUUID().toString());
        }
        if (person.getSpouses() == null) {
            person.setSpouses(new ArrayList<>());
        }
        if (person.getChildren() == null) {
            person.setChildren(new ArrayList<>());
        }
        if (person.getMemoryBox() == null) {
            person.setMemoryBox(new MemoryBox());
        }
        person.getMemoryBox().setPerson(person);
    }

    /**
     * Updates the avatar of a target MemoryBox if the source MemoryBox has an avatar.
     *
     * @param target The MemoryBox to update.
     * @param source The MemoryBox containing the avatar to copy.
     * @param logMessage The log message to use if an avatar is set.
     */
    public static void updateMemoryBoxAvatar(MemoryBox target, MemoryBox source, String logMessage) {
        if (source != null && source.getAvatar() != null) {
            String avatarUrl = source.getAvatar();
            target.setAvatar(avatarUrl);
            log.info(logMessage, avatarUrl);
        }
    }

    /**
     * Fetches a Person by ID from the repository, logging a warning if not found.
     *
     * @param personRepository The repository to query.
     * @param personId The ID of the person to fetch.
     * @return An Optional containing the Person if found, or empty if not found.
     */
    public static Optional<Person> fetchPerson(PersonRepository personRepository, String personId) {
        Optional<Person> personOpt = personRepository.findById(personId);
        if (personOpt.isEmpty()) {
            log.warn("Person with ID: {} not found.", personId);
        }
        return personOpt;
    }
}