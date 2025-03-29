package com.familytree.repository;

import com.familytree.model.NotableRecord;
import com.familytree.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotableRecordRepository extends JpaRepository<NotableRecord, String> {
    List<NotableRecord> findByPersonOrderByCreatedAtDesc(Person person);
}