package com.familytree.exception;

public class MemoryBoxNotFoundException extends RuntimeException {
    public MemoryBoxNotFoundException(String id) {
        super("MemoryBox with ID: " + id + " not found");
    }
}