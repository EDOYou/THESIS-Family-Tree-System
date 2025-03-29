package com.familytree.controller;

import com.familytree.model.NotableRecord;
import com.familytree.model.Person;
import com.familytree.model.User;
import com.familytree.model.dto.NotableRecordDTO;
import com.familytree.repository.NotableRecordRepository;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@Slf4j
public class NotableRecordController {

    @Autowired
    private NotableRecordRepository notableRecordRepository;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/persons/{personId}/notable-records")
    public ResponseEntity<List<NotableRecordDTO>> getNotableRecords(@PathVariable String personId) {
        log.info("Fetching notable records for person ID: {}", personId);
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new IllegalStateException("Person not found: " + personId));

        List<NotableRecord> records = notableRecordRepository.findByPersonOrderByCreatedAtDesc(person);
        List<NotableRecordDTO> recordDTOs = records.stream()
                .map(NotableRecordDTO::new)
                .collect(Collectors.toList());
        log.info("Returning {} notable records", recordDTOs.size());
        return ResponseEntity.ok(recordDTOs);
    }

    @PostMapping("/notable-records")
    @Transactional
    public ResponseEntity<NotableRecordDTO> createNotableRecord(@Valid @RequestBody NotableRecord record) {
        log.info("Creating notable record: {}", record.getTitle());
        if (record.getTitle() == null || record.getTitle().trim().isEmpty()) {
            log.warn("Record title is empty");
            return ResponseEntity.badRequest().body(null);
        }
        if (record.getType() == null || record.getType().trim().isEmpty()) {
            log.warn("Record type is empty");
            return ResponseEntity.badRequest().body(null);
        }
        if (record.getDescription() == null || record.getDescription().trim().isEmpty()) {
            log.warn("Record description is empty");
            return ResponseEntity.badRequest().body(null);
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + username));

        Person person = personRepository.findById(record.getPerson().getId())
                .orElseThrow(() -> new IllegalStateException("Person not found: " + record.getPerson().getId()));

        record.setCreatedBy(user);
        record.setPerson(person);

        NotableRecord savedRecord = notableRecordRepository.save(record);
        NotableRecordDTO recordDTO = new NotableRecordDTO(savedRecord);
        log.info("Created notable record with ID: {}", savedRecord.getId());
        return ResponseEntity.ok(recordDTO);
    }

    @DeleteMapping("/notable-records/{id}")
    @Transactional
    public ResponseEntity<?> deleteNotableRecord(@PathVariable String id) {
        log.info("Deleting notable record with ID: {}", id);
        return notableRecordRepository.findById(id)
                .map(record -> {
                    String username = SecurityContextHolder.getContext().getAuthentication().getName();
                    if (!record.getCreatedBy().getUsername().equals(username)) {
                        log.warn("User {} is not authorized to delete record {}", username, id);
                        return ResponseEntity.status(403).build();
                    }
                    notableRecordRepository.delete(record);
                    log.info("Deleted notable record with ID: {}", id);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> {
                    log.warn("Notable record with ID: {} not found", id);
                    return ResponseEntity.notFound().build();
                });
    }
}