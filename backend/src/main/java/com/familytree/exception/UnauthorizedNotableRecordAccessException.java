package com.familytree.exception;

public class UnauthorizedNotableRecordAccessException extends RuntimeException {
    public UnauthorizedNotableRecordAccessException(String message) {
        super(message);
    }
}