package com.familytree.repository;

import com.familytree.model.MemoryBox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MemoryBoxRepository extends JpaRepository<MemoryBox, String> { }