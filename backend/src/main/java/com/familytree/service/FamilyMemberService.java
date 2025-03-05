package com.familytree.service;

import com.familytree.model.FamilyMember;
import com.familytree.repository.FamilyMemberRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
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
        log.debug("Saving new FamilyMember to repo: {}", member);
        FamilyMember savedMember = familyMemberRepository.save(member);
        log.debug("Successfully saved FamilyMember with id: {}", savedMember.getId());
        return savedMember;
    }

    public void deleteMember(Long id) {
        familyMemberRepository.deleteById(id);
    }
}
