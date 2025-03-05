package com.familytree.controller;

import com.familytree.model.FamilyMember;
import com.familytree.service.FamilyMemberService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/family")
@Slf4j
public class FamilyMemberController {

    @Autowired
    private FamilyMemberService familyMemberService;

    @GetMapping("/members")
    public List<FamilyMember> getAllMembers() {
        log.info("Fetching all family members");
        List<FamilyMember> members = familyMemberService.getAllMembers();
        log.info("Found {} members", members.size());
        return members;
    }

    @GetMapping("/members/{id}")
    public Optional<FamilyMember> getMemberById(@PathVariable Long id) {
        return familyMemberService.getMemberById(id);
    }

    @PostMapping("/members")
    public FamilyMember addMember(@RequestBody FamilyMember member) {
        log.info("Received request to add family member: {}", member);
        FamilyMember savedMember = familyMemberService.addMember(member);
        log.info("Family member added with ID: {}", savedMember.getId());
        return savedMember;
    }

    @DeleteMapping("/members/{id}")
    public void deleteMember(@PathVariable Long id) {
        familyMemberService.deleteMember(id);
    }
}
