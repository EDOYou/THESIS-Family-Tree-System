package com.familytree.service;

import com.familytree.exception.InvalidMemoryBoxException;
import com.familytree.exception.MemoryBoxNotFoundException;
import com.familytree.exception.PersonNotFoundException;
import com.familytree.model.MemoryBox;
import com.familytree.model.Person;
import com.familytree.repository.MemoryBoxRepository;
import com.familytree.repository.PersonRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
public class MemoryBoxService {

    private final MemoryBoxRepository memoryBoxRepository;
    private final PersonRepository personRepository;

    public MemoryBoxService(MemoryBoxRepository memoryBoxRepository, PersonRepository personRepository) {
        this.memoryBoxRepository = memoryBoxRepository;
        this.personRepository = personRepository;
    }

    public List<MemoryBox> getAllMemoryBoxes() {
        log.info("Fetching all memory boxes");
        return memoryBoxRepository.findAll();
    }

    public MemoryBox getMemoryBoxById(String id) {
        log.info("Fetching memory box with id {}", id);
        return memoryBoxRepository.findById(id)
                .orElseThrow(() -> new MemoryBoxNotFoundException(id));
    }

    public MemoryBox getMemoryBoxByPersonId(String personId) {
        log.info("Fetching memory box for person with id {}", personId);
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> {
                    log.warn("Person with id {} not found", personId);
                    return new PersonNotFoundException(personId);
                });

        MemoryBox memoryBox = person.getMemoryBox();
        if (memoryBox == null) {
            log.warn("No MemoryBox found for person with id {}", personId);
            throw new MemoryBoxNotFoundException("No MemoryBox for person with id " + personId);
        }
        log.info("Found MemoryBox with id {} for person with id {}", memoryBox.getId(), personId);
        return memoryBox;
    }

    @Transactional
    public MemoryBox createMemoryBox(String personId, MemoryBox memoryBox) {
        log.info("Creating memory box for person with id {}", personId);
        log.debug("MemoryBox data received: {}", memoryBox);
        Person person = personRepository.findById(personId)
                .orElseThrow(() -> {
                    log.error("Person with id {} not found", personId);
                    return new PersonNotFoundException(personId);
                });

        if (person.getMemoryBox() != null) {
            log.warn("Person with id {} already has a memory box", personId);
            throw new InvalidMemoryBoxException("Person with id " + personId + " already has a memory box");
        }

        if (memoryBox.getAvatar() != null && !isValidImageUrl(memoryBox.getAvatar())) {
            log.error("Invalid avatar URL: {}", memoryBox.getAvatar());
            throw new InvalidMemoryBoxException("Invalid avatar URL: " + memoryBox.getAvatar());
        }

        person.setMemoryBox(memoryBox);
        personRepository.save(person);
        log.info("Created MemoryBox with id {} for person with id {}, avatar: {}", memoryBox.getId(), personId, memoryBox.getAvatar());
        return memoryBox;
    }

    @Transactional
    public MemoryBox updateAvatar(String id, String avatarUrl) {
        log.info("Updating avatar for memory box with id {}", id);
        String cleanedAvatarUrl = cleanAvatarUrl(avatarUrl);
        log.debug("Avatar URL received: {}", cleanedAvatarUrl);

        MemoryBox memoryBox = memoryBoxRepository.findById(id)
                .orElseThrow(() -> new MemoryBoxNotFoundException(id));

        log.debug("Before update - MemoryBox ID: {}, Avatar: {}", memoryBox.getId(), memoryBox.getAvatar());
        memoryBox.setAvatar(cleanedAvatarUrl);
        MemoryBox updatedMemoryBox = memoryBoxRepository.saveAndFlush(memoryBox);
        log.debug("After update - MemoryBox ID: {}, Avatar: {}", updatedMemoryBox.getId(), updatedMemoryBox.getAvatar());
        log.info("Updated MemoryBox with id {}, new avatar: {}", updatedMemoryBox.getId(), updatedMemoryBox.getAvatar());
        return updatedMemoryBox;
    }

    @Transactional
    public void deleteMemoryBox(String id) {
        log.info("Deleting memory box with id {}", id);
        MemoryBox memoryBox = memoryBoxRepository.findById(id)
                .orElseThrow(() -> new MemoryBoxNotFoundException(id));

        Person person = memoryBox.getPerson();
        if (person != null) {
            person.setMemoryBox(null);
            personRepository.save(person);
        }
        memoryBoxRepository.delete(memoryBox);
        log.info("Deleted MemoryBox with id {}", id);
    }

    private String cleanAvatarUrl(String avatarUrl) {
        if (avatarUrl != null && avatarUrl.startsWith("\"") && avatarUrl.endsWith("\"")) {
            String cleaned = avatarUrl.substring(1, avatarUrl.length() - 1);
            log.debug("Cleaned avatar URL: {}", cleaned);
            return cleaned;
        }
        return avatarUrl;
    }

    private boolean isValidImageUrl(String url) {
        if (url == null) return false;
        return url.matches("^(https?://.*\\.(?:png|jpg|jpeg|gif))$");
    }
}