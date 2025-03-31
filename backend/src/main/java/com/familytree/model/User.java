package com.familytree.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(nullable = false)
    private String dateOfBirth;

    public User() {
        this.role = "USER";
    }

    public User(String username, String email, String password, String role, String dateOfBirth) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role != null ? role : "USER";
        this.dateOfBirth = dateOfBirth;
    }
}