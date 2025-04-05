package com.familytree.repository;

import com.familytree.model.FamilyEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface FamilyEventRepository extends JpaRepository<FamilyEvent, String> {
    List<FamilyEvent> findAllByOrderByEventDateAsc();
    List<FamilyEvent> findByReminderDateLessThanEqualOrderByEventDateAsc(LocalDate date);
}