package com.familytree.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PersonDTO {
    private String name;
    @JsonProperty("parent") // Map "parent" in JSON to parentId
    private Long parentId;

    // Getters, setters, and no-args constructor
    public PersonDTO() {}
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
}