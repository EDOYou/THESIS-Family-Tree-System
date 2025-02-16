package com.familytree.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "family_members")
public class FamilyMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private String gender;
    private String birthDate;
    private String deathDate;
    private String occupation;

    @ManyToOne
    @JoinColumn(name = "father_id", nullable = true)
    private FamilyMember father;

    @ManyToOne
    @JoinColumn(name = "mother_id", nullable = true)
    private FamilyMember mother;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private Set<Marriage> marriages = new HashSet<>();

    @OneToMany(mappedBy = "spouse", cascade = CascadeType.ALL)
    private Set<Marriage> spouseMarriages = new HashSet<>();

    public FamilyMember(String firstName, String lastName, String gender, String birthDate, FamilyMember father, FamilyMember mother) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = gender;
        this.birthDate = birthDate;
        this.father = father;
        this.mother = mother;
    }
}
