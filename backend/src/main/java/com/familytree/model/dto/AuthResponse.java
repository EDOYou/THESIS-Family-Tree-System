package com.familytree.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuthResponse {
    private String username;
    private String role;

    public AuthResponse(String username, String role) {
        this.username = username;
        this.role = role;
    }
}