package com.familytree.controller;

import com.familytree.model.MemoryBox;
import com.familytree.service.MemoryBoxService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.Pattern;
import java.util.List;

@RestController
@RequestMapping("/api/memory-boxes")
public class MemoryBoxController {

    private final MemoryBoxService memoryBoxService;

    public MemoryBoxController(MemoryBoxService memoryBoxService) {
        this.memoryBoxService = memoryBoxService;
    }

    @GetMapping
    public ResponseEntity<List<MemoryBox>> getAllMemoryBoxes() {
        List<MemoryBox> memoryBoxes = memoryBoxService.getAllMemoryBoxes();
        return ResponseEntity.ok(memoryBoxes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemoryBox> getMemoryBoxById(@PathVariable String id) {
        MemoryBox memoryBox = memoryBoxService.getMemoryBoxById(id);
        return ResponseEntity.ok(memoryBox);
    }

    @GetMapping("/person/{personId}")
    public ResponseEntity<MemoryBox> getMemoryBoxByPersonId(@PathVariable String personId) {
        MemoryBox memoryBox = memoryBoxService.getMemoryBoxByPersonId(personId);
        return ResponseEntity.ok(memoryBox);
    }

    @PostMapping("/person/{personId}")
    public ResponseEntity<MemoryBox> createMemoryBox(
            @PathVariable String personId,
            @RequestBody MemoryBox memoryBox) {
        MemoryBox createdMemoryBox = memoryBoxService.createMemoryBox(personId, memoryBox);
        return ResponseEntity.ok(createdMemoryBox);
    }

    @PutMapping("/{id}/avatar")
    public ResponseEntity<MemoryBox> updateAvatar(
            @PathVariable String id,
            @RequestBody @Pattern(regexp = "^(https?://.*\\.(?:png|jpg|jpeg|gif))$", message = "Invalid image URL") String avatarUrl) {
        MemoryBox updatedMemoryBox = memoryBoxService.updateAvatar(id, avatarUrl);
        return ResponseEntity.ok(updatedMemoryBox);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMemoryBox(@PathVariable String id) {
        memoryBoxService.deleteMemoryBox(id);
        return ResponseEntity.ok().build();
    }
}