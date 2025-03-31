package com.familytree.controller;

import com.familytree.model.Quiz;
import com.familytree.repository.QuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    @Autowired
    private QuizRepository quizRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<Quiz> createQuiz(@RequestBody Quiz quiz) {
        Quiz savedQuiz = quizRepository.save(quiz);
        return ResponseEntity.ok(savedQuiz);
    }

    @GetMapping
    public ResponseEntity<List<Quiz>> getAllQuizzes() {
        List<Quiz> quizzes = quizRepository.findAll();
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/random")
    public ResponseEntity<Quiz> getRandomQuiz() {
        List<Quiz> quizzes = quizRepository.findAll();
        if (quizzes.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Random random = new Random();
        Quiz randomQuiz = quizzes.get(random.nextInt(quizzes.size()));
        return ResponseEntity.ok(randomQuiz);
    }

    @PutMapping("/{quizId}")
    @Transactional
    public ResponseEntity<Quiz> updateQuiz(@PathVariable Long quizId, @RequestBody Quiz quiz) {
        return quizRepository.findById(quizId)
                .map(existingQuiz -> {
                    existingQuiz.setQuestion(quiz.getQuestion());
                    existingQuiz.setOption1(quiz.getOption1());
                    existingQuiz.setOption2(quiz.getOption2());
                    existingQuiz.setOption3(quiz.getOption3());
                    existingQuiz.setOption4(quiz.getOption4());
                    existingQuiz.setCorrectOption(quiz.getCorrectOption());
                    Quiz updatedQuiz = quizRepository.save(existingQuiz);
                    return ResponseEntity.ok(updatedQuiz);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{quizId}")
    @Transactional
    public ResponseEntity<?> deleteQuiz(@PathVariable Long quizId) {
        return quizRepository.findById(quizId)
                .map(quiz -> {
                    quizRepository.delete(quiz);
                    return ResponseEntity.ok().build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}