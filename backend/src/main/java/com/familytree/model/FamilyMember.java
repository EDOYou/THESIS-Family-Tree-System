package com.familytree.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "family_members")
public class FamilyMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private String birthDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private String deathDate;
    private String occupation;

    @ManyToOne
    @JoinColumn(name = "father_id")
    private FamilyMember father;

    @ManyToOne
    @JoinColumn(name = "mother_id")
    private FamilyMember mother;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL)
    private Set<Marriage> marriages = new HashSet<>();

    @OneToMany(mappedBy = "spouse", cascade = CascadeType.ALL)
    private Set<Marriage> spouseMarriages = new HashSet<>();

    public FamilyMember(String firstName, String lastName, Gender gender, String birthDate, FamilyMember father, FamilyMember mother) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = gender;
        this.birthDate = birthDate;
        this.father = father;
        this.mother = mother;
    }
}
