package com.familytree.service;

import com.familytree.model.FamilyMember;
import com.familytree.repository.FamilyMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class FamilyMemberService {

    @Autowired
    private FamilyMemberRepository familyMemberRepository;

    public List<FamilyMember> getAllMembers() {
        return familyMemberRepository.findAll();
    }

    public Optional<FamilyMember> getMemberById(Long id) {
        return familyMemberRepository.findById(id);
    }

    public FamilyMember addMember(FamilyMember member) {
        return familyMemberRepository.save(member);
    }

    public void deleteMember(Long id) {
        familyMemberRepository.deleteById(id);
    }
}
