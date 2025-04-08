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

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.status(400).body(e.getMessage());
    }
}