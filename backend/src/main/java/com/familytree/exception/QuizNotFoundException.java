package com.familytree.exception;

public class QuizNotFoundException extends RuntimeException {
    public QuizNotFoundException(Long id) {
        super("Quiz with ID: " + id + " not found");
    }

    public QuizNotFoundException(String message) {
        super(message);
    }
}