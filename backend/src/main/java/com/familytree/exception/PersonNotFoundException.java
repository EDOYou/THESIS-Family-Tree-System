package com.familytree.exception;

public class PersonNotFoundException extends RuntimeException {
    public PersonNotFoundException(String id) {
        super("Person with ID: " + id + " not found");
    }
}