package com.familytree.service;

import com.familytree.model.Person;
import com.familytree.model.dto.PersonDTO;

import java.util.List;
import java.util.Optional;

public interface PersonServiceInterface {

    List<PersonDTO> getAllPersons();
    PersonDTO createPerson(Person person);
    Optional<PersonDTO> saveOrUpdatePerson(String personId, Person person);
    Optional<?> addChild(String personId, Person child);
    Optional<?> addSpouse(String personId, Person spouse);
    boolean deletePerson(String personId);
}