package com.familytree.exception;

import java.util.UUID;

public class EventNotFoundException extends RuntimeException {
    public EventNotFoundException(String id) {
        super("Family event with ID: " + id + " not found");
    }
}