package com.familytree.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.Data;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "persons")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Person {

    @Id
    private String id;

    private String name;
    private Gender gender;
    private String occupation;
    private Integer age;
    private String birthDate;
    private String deathDate;
    private String birthPlace;
    private String deathPlace;

    @ElementCollection
    private List<String> spouses = new ArrayList<>();

    @ElementCollection
    private List<String> children = new ArrayList<>();

    private String fatherId;
    private String motherId;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "memory_box_id")
    @JsonManagedReference
    private MemoryBox memoryBox;

    public Person() {
        setMemoryBox(new MemoryBox());
    }

    public void setMemoryBox(MemoryBox memoryBox) {
        this.memoryBox = memoryBox;
        if (memoryBox != null) {
            memoryBox.setPerson(this);
        }
    }

    public void addSpouse(String spouseId) {
        if (spouses == null) spouses = new ArrayList<>();
        if (!spouses.contains(spouseId)) {
            spouses.add(spouseId);
        }
    }

    public void removeSpouse(String spouseId) {
        if (spouses != null) {
            spouses.remove(spouseId);
        }
    }

    public void addChild(String childId) {
        if (children == null) children = new ArrayList<>();
        if (!children.contains(childId)) {
            children.add(childId);
        }
    }

    public void removeChild(String childId) {
        if (children != null) {
            children.remove(childId);
        }
    }
}