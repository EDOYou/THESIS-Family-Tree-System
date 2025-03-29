package com.familytree.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.Data;
import jakarta.persistence.*;

@Data
@Entity
@Table(name = "memory_boxes")
public class MemoryBox {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String avatar;

    @OneToOne(mappedBy = "memoryBox")
    @JsonBackReference
    private Person person;
}