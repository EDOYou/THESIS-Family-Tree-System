package com.familytree.repository;

import com.familytree.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.nio.channels.FileChannel;
import java.util.Optional;

@Repository
public interface PersonRepository extends JpaRepository<Person, String> {
    Optional<Person> findByName(String name);
    Optional<Person> findFirstByFatherIdIsNullAndMotherIdIsNull();
}
