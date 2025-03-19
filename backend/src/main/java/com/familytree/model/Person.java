package com.familytree.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "person_spouses", joinColumns = @JoinColumn(name = "person_id"))
    @Column(name = "spouse_id")
    private List<String> spouses = new ArrayList<>();

    @Column(name = "father_id")
    private String fatherId;

    @Column(name = "mother_id")
    private String motherId;

    @ElementCollection
    @CollectionTable(name = "person_children", joinColumns = @JoinColumn(name = "person_id"))
    @Column(name = "child_id")
    private List<String> children = new ArrayList<>();

    public Person() {}

    public Person(String id, String name, Integer age, Gender gender) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.gender = gender;
    }

    public void addSpouse(String spouseId) {
        if (!spouses.contains(spouseId)) {
            spouses.add(spouseId);
        }
    }

    public void removeSpouse(String spouseId) {
        spouses.remove(spouseId);
    }

    public void addChild(String childId) {
        if (!children.contains(childId)) {
            children.add(childId);
        }
    }

    public void removeChild(String childId) {
        children.remove(childId);
    }

    public void setParent(String fatherId, String motherId) {
        this.fatherId = fatherId;
        this.motherId = motherId;
    }
}