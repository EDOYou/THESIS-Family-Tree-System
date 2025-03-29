package com.familytree.repository;

import com.familytree.model.FamilyEvent;
import com.familytree.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FamilyEventRepository extends JpaRepository<FamilyEvent, String> {
    List<FamilyEvent> findByCreatedByOrderByEventDateAsc(User createdBy);
    List<FamilyEvent> findByReminderDateLessThanEqualAndCreatedByOrderByEventDateAsc(LocalDate date, User createdBy);
}