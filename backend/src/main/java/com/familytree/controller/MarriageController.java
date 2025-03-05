package com.familytree.controller;

import com.familytree.model.Marriage;
import com.familytree.service.MarriageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/marriages")
public class MarriageController {

    @Autowired
    private MarriageService marriageService;

    @GetMapping
    public List<Marriage> getAllMarriages() {
        return marriageService.getAllMarriages();
    }

    @PostMapping
    public Marriage addMarriage(@RequestBody Marriage marriage) {
        return marriageService.addMarriage(marriage);
    }
}
