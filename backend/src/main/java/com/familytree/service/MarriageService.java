package com.familytree.service;

import com.familytree.model.Marriage;
import com.familytree.repository.MarriageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MarriageService {

    @Autowired
    private MarriageRepository marriageRepository;

    public List<Marriage> getAllMarriages() {
        return marriageRepository.findAll();
    }

    public Marriage addMarriage(Marriage marriage) {
        return marriageRepository.save(marriage);
    }
}
