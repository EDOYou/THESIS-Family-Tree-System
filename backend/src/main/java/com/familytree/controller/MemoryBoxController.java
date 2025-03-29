package com.familytree.controller;

import com.familytree.model.MemoryBox;
import com.familytree.model.Person;
import com.familytree.repository.MemoryBoxRepository;
import com.familytree.repository.PersonRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.Pattern;
import java.util.List;

@RestController
@RequestMapping("/api/memory-boxes")
@Slf4j
public class MemoryBoxController {

    @Autowired
    private MemoryBoxRepository memoryBoxRepository;

    @Autowired
    private PersonRepository personRepository;

    @GetMapping
    public ResponseEntity<List<MemoryBox>> getAllMemoryBoxes() {
        log.info("Fetching all memory boxes");
        List<MemoryBox> memoryBoxes = memoryBoxRepository.findAll();
        return ResponseEntity.ok(memoryBoxes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemoryBox> getMemoryBoxById(@PathVariable String id) {
        log.info("Fetching memory box with id {}", id);
        return memoryBoxRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/person/{personId}")
    public ResponseEntity<?> getMemoryBoxByPersonId(@PathVariable String personId) {
        log.info("Fetching memory box for person with id {}", personId);
        return personRepository.findById(personId)
                .map(person -> {
                    MemoryBox memoryBox = person.getMemoryBox();
                    if (memoryBox == null) {
                        log.warn("No MemoryBox found for person with id {}", personId);
                        return ResponseEntity.notFound().build();
                    }
                    log.info("Found MemoryBox with id {} for person with id {}", memoryBox.getId(), personId);
                    return ResponseEntity.ok(memoryBox);
                })
                .orElseGet(() -> {
                    log.warn("Person with id {} not found", personId);
                    return ResponseEntity.notFound().build();
                });
    }

    @PostMapping("/person/{personId}")
    @Transactional
    public ResponseEntity<?> createMemoryBox(
            @PathVariable String personId,
            @RequestBody MemoryBox memoryBox) {
        log.info("Creating memory box for person with id {}", personId);
        log.debug("MemoryBox data received: {}", memoryBox);
        return personRepository.findById(personId)
                .map(person -> {
                    if (person.getMemoryBox() != null) {
                        log.warn("Person with id {} already has a memory box", personId);
                        return ResponseEntity.badRequest().body(null);
                    }
                    if (memoryBox.getAvatar() != null && !isValidImageUrl(memoryBox.getAvatar())) {
                        log.error("Invalid avatar URL: {}", memoryBox.getAvatar());
                        return ResponseEntity.badRequest().body(null);
                    }
                    person.setMemoryBox(memoryBox);
                    personRepository.save(person);
                    log.info("Created MemoryBox with id {} for person with id {}, avatar: {}", memoryBox.getId(), personId, memoryBox.getAvatar());
                    return ResponseEntity.ok(memoryBox);
                })
                .orElseGet(() -> {
                    log.error("Person with id {} not found", personId);
                    return ResponseEntity.notFound().build();
                });
    }

    @PutMapping("/{id}/avatar")
    @Transactional
    public ResponseEntity<MemoryBox> updateAvatar(
            @PathVariable String id,
            @RequestBody @Pattern(regexp = "^(https?://.*\\.(?:png|jpg|jpeg|gif))$", message = "Invalid image URL") String avatarUrl) {
        log.info("Updating avatar for memory box with id {}", id);
        String cleanedAvatarUrl;
        if (avatarUrl != null && avatarUrl.startsWith("\"") && avatarUrl.endsWith("\"")) {
            cleanedAvatarUrl = avatarUrl.substring(1, avatarUrl.length() - 1);
            log.debug("Cleaned avatar URL: {}", cleanedAvatarUrl);
        } else {
            cleanedAvatarUrl = avatarUrl;
        }
        log.debug("Avatar URL received: {}", cleanedAvatarUrl);
        try {
            return memoryBoxRepository.findById(id)
                    .map(memoryBox -> {
                        log.debug("Before update - MemoryBox ID: {}, Avatar: {}", memoryBox.getId(), memoryBox.getAvatar());
                        memoryBox.setAvatar(cleanedAvatarUrl);
                        MemoryBox updatedMemoryBox = memoryBoxRepository.saveAndFlush(memoryBox);
                        log.debug("After update - MemoryBox ID: {}, Avatar: {}", updatedMemoryBox.getId(), updatedMemoryBox.getAvatar());
                        log.info("Updated MemoryBox with id {}, new avatar: {}", updatedMemoryBox.getId(), updatedMemoryBox.getAvatar());
                        return ResponseEntity.ok(updatedMemoryBox);
                    })
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error updating avatar for MemoryBox with id {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteMemoryBox(@PathVariable String id) {
        log.info("Deleting memory box with id {}", id);
        return memoryBoxRepository.findById(id)
                .map(memoryBox -> {
                    Person person = memoryBox.getPerson();
                    if (person != null) {
                        person.setMemoryBox(null);
                        personRepository.save(person);
                    }
                    memoryBoxRepository.delete(memoryBox);
                    log.info("Deleted MemoryBox with id {}", id);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private boolean isValidImageUrl(String url) {
        if (url == null) return false;
        return url.matches("^(https?://.*\\.(?:png|jpg|jpeg|gif))$");
    }
}