package com.familytree.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "persons")
@Setter
@Getter
@JsonIgnoreProperties(ignoreUnknown = true)
public class Person {

    @Id
    @Column(length = 36)
    private String id;

    @NotNull
    @Size(min = 2, max = 30)
    private String name;

    @NotNull
    @Min(0)
    private Integer age;

    private String occupation;
    private String birthDate;
    private String deathDate;
    private String birthPlace;
    private String deathPlace;
    private Boolean hasSubTree;

    @NotNull
    @Enumerated(EnumType.STRING)
    private Gender gender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "spouse_id")
    @JsonBackReference(value = "spouse-reference")
    private Person spouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @JsonBackReference(value = "children-reference")
    private Person parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference(value = "children-reference")
    private List<Person> children = new ArrayList<>();

    public Person() {}

    public Person(String id, String name, Integer age, Gender gender) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.gender = gender;
    }
}