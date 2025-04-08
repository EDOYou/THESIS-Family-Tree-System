package com.familytree.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthenticatedException.class)
    public ResponseEntity<Void> handleUnauthenticatedException(UnauthenticatedException e) {
        return ResponseEntity.status(401).build();
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Void> handleUserNotFoundException(UserNotFoundException e) {
        return ResponseEntity.status(404).build();
    }

    @ExceptionHandler(EventNotFoundException.class)
    public ResponseEntity<Void> handleEventNotFoundException(EventNotFoundException e) {
        return ResponseEntity.status(404).build();
    }

    @ExceptionHandler(UnauthorizedEventAccessException.class)
    public ResponseEntity<Void> handleUnauthorizedEventAccessException(UnauthorizedEventAccessException e) {
        return ResponseEntity.status(403).build();
    }

    @ExceptionHandler(InvalidEventException.class)
    public ResponseEntity<Void> handleInvalidEventException(InvalidEventException e) {
        return ResponseEntity.status(400).build();
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Void> handleIllegalStateException(IllegalStateException e) {
        return ResponseEntity.status(404).build();
    }

    @ExceptionHandler(MemoryBoxNotFoundException.class)
    public ResponseEntity<Void> handleMemoryBoxNotFoundException(MemoryBoxNotFoundException e) {
        return ResponseEntity.status(404).build();
    }

    @ExceptionHandler(PersonNotFoundException.class)
    public ResponseEntity<Void> handlePersonNotFoundException(PersonNotFoundException e) {
        return ResponseEntity.status(404).build();
    }

    @ExceptionHandler(InvalidMemoryBoxException.class)
    public ResponseEntity<Void> handleInvalidMemoryBoxException(InvalidMemoryBoxException e) {
        return ResponseEntity.status(400).build();
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.status(400).body(e.getMessage());
    }

    @ExceptionHandler(InvalidMessageException.class)
    public ResponseEntity<Void> handleInvalidMessageException(InvalidMessageException e) {
        return ResponseEntity.status(400).build();
    }

    @ExceptionHandler(NotableRecordNotFoundException.class)
    public ResponseEntity<Void> handleNotableRecordNotFoundException(NotableRecordNotFoundException e) {
        return ResponseEntity.status(404).build();
    }

    @ExceptionHandler(InvalidNotableRecordException.class)
    public ResponseEntity<Void> handleInvalidNotableRecordException(InvalidNotableRecordException e) {
        return ResponseEntity.status(400).build();
    }

    @ExceptionHandler(UnauthorizedNotableRecordAccessException.class)
    public ResponseEntity<Void> handleUnauthorizedNotableRecordAccessException(UnauthorizedNotableRecordAccessException e) {
        return ResponseEntity.status(403).build();
    }

    @ExceptionHandler(QuizNotFoundException.class)
    public ResponseEntity<Void> handleQuizNotFoundException(QuizNotFoundException e) {
        return ResponseEntity.status(404).build();
    }

    @ExceptionHandler(InvalidQuizException.class)
    public ResponseEntity<Void> handleInvalidQuizException(InvalidQuizException e) {
        return ResponseEntity.status(400).build();
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Void> handleUnauthorizedException(UnauthorizedException e) {
        return ResponseEntity.status(403).build();
    }
}