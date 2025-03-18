package com.familytree.model.dto;

import com.familytree.model.Person;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
    private String spouseId;
    private String parentId;
    private List<PersonDTO> children = new ArrayList<>();

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
        this.spouseId = person.getSpouse() != null ? person.getSpouse().getId() : null;
        this.parentId = person.getParent() != null ? person.getParent().getId() : null;
        this.children = person.getChildren() != null ?
                person.getChildren().stream().map(PersonDTO::new).collect(Collectors.toList()) :
                new ArrayList<>();
    }
}