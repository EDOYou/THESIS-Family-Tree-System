package com.familytree.exception;

public class NotableRecordNotFoundException extends RuntimeException {
    public NotableRecordNotFoundException(String id) {
        super("Notable record with ID: " + id + " not found");
    }
}