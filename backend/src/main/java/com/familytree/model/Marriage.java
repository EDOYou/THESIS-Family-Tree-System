package com.familytree.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Builder
@Entity
@Table(name = "marriages")
@NoArgsConstructor
@AllArgsConstructor
public class Marriage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "member_id", nullable = false)
    private FamilyMember member;

    @ManyToOne
    @JoinColumn(name = "spouse_id", nullable = false)
    private FamilyMember spouse;

    private String marriageDate;
    private String divorceDate;

    public Marriage(FamilyMember member, FamilyMember spouse, String marriageDate) {
        this.member = member;
        this.spouse = spouse;
        this.marriageDate = marriageDate;
    }
}
