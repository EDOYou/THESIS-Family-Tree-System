package com.familytree.controller;

import com.familytree.model.FamilyMember;
import com.familytree.service.FamilyMemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/family")
public class FamilyMemberController {

    @Autowired
    private FamilyMemberService familyMemberService;

    @GetMapping("/members")
    public List<FamilyMember> getAllMembers() {
        return familyMemberService.getAllMembers();
    }

    @GetMapping("/members/{id}")
    public Optional<FamilyMember> getMemberById(@PathVariable Long id) {
        return familyMemberService.getMemberById(id);
    }

    @PostMapping("/members")
    public FamilyMember addMember(@RequestBody FamilyMember member) {
        return familyMemberService.addMember(member);
    }

    @DeleteMapping("/members/{id}")
    public void deleteMember(@PathVariable Long id) {
        familyMemberService.deleteMember(id);
    }
}
