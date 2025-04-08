package com.familytree.service;

import com.familytree.exception.InvalidNotableRecordException;
import com.familytree.exception.NotableRecordNotFoundException;
import com.familytree.exception.PersonNotFoundException;
import com.familytree.exception.UnauthenticatedException;
import com.familytree.exception.UserNotFoundException;
import com.familytree.exception.UnauthorizedNotableRecordAccessException;
import com.familytree.model.NotableRecord;
import com.familytree.model.Person;
import com.familytree.model.User;
import com.familytree.model.dto.NotableRecordDTO;
import com.familytree.repository.NotableRecordRepository;
import com.familytree.repository.PersonRepository;
import com.familytree.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class NotableRecordService {

    private final NotableRecordRepository notableRecordRepository;
    private final PersonRepository personRepository;
    private final UserRepository userRepository;

    public NotableRecordService(NotableRecordRepository notableRecordRepository,
                                PersonRepository personRepository,
                                UserRepository userRepository) {
        this.notableRecordRepository = notableRecordRepository;
        this.personRepository = personRepository;
        this.userRepository = userRepository;
    }

    public List<NotableRecordDTO> getNotableRecords(String personId) {
        log.info("Fetching notable records for person ID: {}", personId);
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> {
                    log.warn("Person not found: {}", personId);
                    return new PersonNotFoundException(personId);
                });

        List<NotableRecord> records = notableRecordRepository.findByPersonOrderByCreatedAtDesc(person);
        List<NotableRecordDTO> recordDTOs = records.stream()
                .map(NotableRecordDTO::new)
                .collect(Collectors.toList());
        log.info("Returning {} notable records", recordDTOs.size());
        return recordDTOs;
    }

    @Transactional
    public NotableRecordDTO createNotableRecord(NotableRecord record) {
        log.info("Creating notable record: {}", record.getTitle());
        if (record.getTitle() == null || record.getTitle().trim().isEmpty()) {
            log.warn("Record title is empty");
            throw new InvalidNotableRecordException("Record title cannot be empty");
        }
        if (record.getType() == null || record.getType().trim().isEmpty()) {
            log.warn("Record type is empty");
            throw new InvalidNotableRecordException("Record type cannot be empty");
        }
        if (record.getDescription() == null || record.getDescription().trim().isEmpty()) {
            log.warn("Record description is empty");
            throw new InvalidNotableRecordException("Record description cannot be empty");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthenticatedException("User is not authenticated");
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("Authenticated user not found: {}", username);
                    return new UserNotFoundException("Authenticated user not found: " + username);
                });

        Person person = personRepository.findById(record.getPerson().getId())
                .orElseThrow(() -> {
                    log.warn("Person not found: {}", record.getPerson().getId());
                    return new PersonNotFoundException(record.getPerson().getId());
                });

        record.setCreatedBy(user);
        record.setPerson(person);

        NotableRecord savedRecord = notableRecordRepository.save(record);
        NotableRecordDTO recordDTO = new NotableRecordDTO(savedRecord);
        log.info("Created notable record with ID: {}", savedRecord.getId());
        return recordDTO;
    }

    @Transactional
    public void deleteNotableRecord(String id) {
        log.info("Deleting notable record with ID: {}", id);
        NotableRecord record = notableRecordRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Notable record with ID: {} not found", id);
                    return new NotableRecordNotFoundException(id);
                });

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthenticatedException("User is not authenticated");
        }

        String username = authentication.getName();
        if (!record.getCreatedBy().getUsername().equals(username)) {
            log.warn("User {} is not authorized to delete record {}", username, id);
            throw new UnauthorizedNotableRecordAccessException("User " + username + " is not authorized to delete record " + id);
        }

        notableRecordRepository.delete(record);
        log.info("Deleted notable record with ID: {}", id);
    }
}