package com.familytree.model.dto;

import com.familytree.model.Person;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Setter
@Getter
public class PersonDTO {
    private String id;
    private String name;
    private Integer age;
    private String occupation;
    private String birthDate;
    private String deathDate;
    private String birthPlace;
    private String deathPlace;
    private Boolean hasSubTree;
    private String gender;
    private List<String> spouses = new ArrayList<>();
    private String fatherId;
    private String motherId;
    private List<String> children = new ArrayList<>();
    private byte[] memoryBoxFile;
    private String memoryBoxFilename;
    private String memoryBoxContentType;

    public PersonDTO() {}

    public PersonDTO(Person person) {
        this.id = person.getId();
        this.name = person.getName();
        this.age = person.getAge();
        this.occupation = person.getOccupation();
        this.birthDate = person.getBirthDate();
        this.deathDate = person.getDeathDate();
        this.birthPlace = person.getBirthPlace();
        this.deathPlace = person.getDeathPlace();
        this.hasSubTree = person.getHasSubTree();
        this.gender = person.getGender() != null ? person.getGender().name() : null;
        this.spouses = person.getSpouses() != null ? new ArrayList<>(person.getSpouses()) : new ArrayList<>();
        this.fatherId = person.getFatherId();
        this.motherId = person.getMotherId();
        this.children = person.getChildren() != null ? new ArrayList<>(person.getChildren()) : new ArrayList<>();
        this.memoryBoxFile = person.getMemoryBoxFile();
        this.memoryBoxFilename = person.getMemoryBoxFilename();
        this.memoryBoxContentType = person.getMemoryBoxContentType();
    }
}