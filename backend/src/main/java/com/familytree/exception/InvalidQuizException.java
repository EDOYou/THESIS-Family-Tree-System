package com.familytree.exception;

public class InvalidQuizException extends RuntimeException {
    public InvalidQuizException(String message) {
        super(message);
    }
}