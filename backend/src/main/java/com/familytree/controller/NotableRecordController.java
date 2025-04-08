package com.familytree.controller;

import com.familytree.model.NotableRecord;
import com.familytree.model.dto.NotableRecordDTO;
import com.familytree.service.NotableRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api")
public class NotableRecordController {

    private final NotableRecordService notableRecordService;

    public NotableRecordController(NotableRecordService notableRecordService) {
        this.notableRecordService = notableRecordService;
    }

    @GetMapping("/persons/{personId}/notable-records")
    public ResponseEntity<List<NotableRecordDTO>> getNotableRecords(@PathVariable String personId) {
        List<NotableRecordDTO> recordDTOs = notableRecordService.getNotableRecords(personId);
        return ResponseEntity.ok(recordDTOs);
    }

    @PostMapping("/notable-records")
    public ResponseEntity<NotableRecordDTO> createNotableRecord(@Valid @RequestBody NotableRecord record) {
        NotableRecordDTO recordDTO = notableRecordService.createNotableRecord(record);
        return ResponseEntity.ok(recordDTO);
    }

    @DeleteMapping("/notable-records/{id}")
    public ResponseEntity<?> deleteNotableRecord(@PathVariable String id) {
        notableRecordService.deleteNotableRecord(id);
        return ResponseEntity.ok().build();
    }
}