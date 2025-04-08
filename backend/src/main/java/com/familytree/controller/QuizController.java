package com.familytree.controller;

import com.familytree.model.Quiz;
import com.familytree.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @PostMapping
    public ResponseEntity<Quiz> createQuiz(@RequestBody Quiz quiz) {
        Quiz savedQuiz = quizService.createQuiz(quiz);
        return ResponseEntity.ok(savedQuiz);
    }

    @GetMapping
    public ResponseEntity<List<Quiz>> getAllQuizzes() {
        List<Quiz> quizzes = quizService.getAllQuizzes();
        return ResponseEntity.ok(quizzes);
    }

    @GetMapping("/random")
    public ResponseEntity<Quiz> getRandomQuiz() {
        Quiz randomQuiz = quizService.getRandomQuiz();
        return ResponseEntity.ok(randomQuiz);
    }

    @PutMapping("/{quizId}")
    public ResponseEntity<Quiz> updateQuiz(@PathVariable Long quizId, @RequestBody Quiz quiz) {
        Quiz updatedQuiz = quizService.updateQuiz(quizId, quiz);
        return ResponseEntity.ok(updatedQuiz);
    }

    @DeleteMapping("/{quizId}")
    public ResponseEntity<?> deleteQuiz(@PathVariable Long quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.ok().build();
    }
}