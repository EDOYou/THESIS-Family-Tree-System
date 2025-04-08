package com.familytree.service;

import com.familytree.exception.*;
import com.familytree.model.Quiz;
import com.familytree.model.User;
import com.familytree.repository.QuizRepository;
import com.familytree.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Service
@Slf4j
public class QuizService {

    private final QuizRepository quizRepository;
    private final UserRepository userRepository;

    public QuizService(QuizRepository quizRepository, UserRepository userRepository) {
        this.quizRepository = quizRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Quiz createQuiz(Quiz quiz) {
        log.info("Creating quiz with question: {}", quiz.getQuestion());
        validateQuiz(quiz);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthenticatedException("User is not authenticated");
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("Authenticated user not found: {}", username);
                    return new UserNotFoundException("Authenticated user not found: " + username);
                });

        quiz.setCreatedBy(user.getId());
        Quiz savedQuiz = quizRepository.save(quiz);
        log.info("Created quiz with ID: {}", savedQuiz.getId());
        return savedQuiz;
    }

    public List<Quiz> getAllQuizzes() {
        log.info("Fetching all quizzes");
        List<Quiz> quizzes = quizRepository.findAll();
        log.info("Returning {} quizzes", quizzes.size());
        return quizzes;
    }

    public Quiz getRandomQuiz() {
        log.info("Fetching a random quiz");
        List<Quiz> quizzes = quizRepository.findAll();
        if (quizzes.isEmpty()) {
            log.warn("No quizzes found");
            throw new QuizNotFoundException("No quizzes available");
        }
        Random random = new Random();
        Quiz randomQuiz = quizzes.get(random.nextInt(quizzes.size()));
        log.info("Returning random quiz with ID: {}", randomQuiz.getId());
        return randomQuiz;
    }

    @Transactional
    public Quiz updateQuiz(Long quizId, Quiz quiz) {
        log.info("Updating quiz with ID: {}", quizId);
        validateQuiz(quiz);

        Quiz existingQuiz = quizRepository.findById(quizId)
                .orElseThrow(() -> {
                    log.warn("Quiz with ID: {} not found", quizId);
                    return new QuizNotFoundException(quizId);
                });

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthenticatedException("User is not authenticated");
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("Authenticated user not found: {}", username);
                    return new UserNotFoundException("Authenticated user not found: " + username);
                });

        if (!existingQuiz.getCreatedBy().equals(user.getId())) {
            log.warn("User {} is not authorized to update quiz {}", username, quizId);
            throw new UnauthorizedException("User " + username + " is not authorized to update quiz " + quizId);
        }

        existingQuiz.setQuestion(quiz.getQuestion());
        existingQuiz.setOption1(quiz.getOption1());
        existingQuiz.setOption2(quiz.getOption2());
        existingQuiz.setOption3(quiz.getOption3());
        existingQuiz.setOption4(quiz.getOption4());
        existingQuiz.setCorrectOption(quiz.getCorrectOption());

        Quiz updatedQuiz = quizRepository.save(existingQuiz);
        log.info("Updated quiz with ID: {}", updatedQuiz.getId());
        return updatedQuiz;
    }

    @Transactional
    public void deleteQuiz(Long quizId) {
        log.info("Deleting quiz with ID: {}", quizId);
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> {
                    log.warn("Quiz with ID: {} not found", quizId);
                    return new QuizNotFoundException(quizId);
                });

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthenticatedException("User is not authenticated");
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("Authenticated user not found: {}", username);
                    return new UserNotFoundException("Authenticated user not found: " + username);
                });

        if (!quiz.getCreatedBy().equals(user.getId())) {
            log.warn("User {} is not authorized to delete quiz {}", username, quizId);
            throw new UnauthorizedException("User " + username + " is not authorized to delete quiz " + quizId);
        }

        quizRepository.delete(quiz);
        log.info("Deleted quiz with ID: {}", quizId);
    }

    private void validateQuiz(Quiz quiz) {
        if (quiz.getQuestion() == null || quiz.getQuestion().trim().isEmpty()) {
            log.warn("Quiz question is empty");
            throw new InvalidQuizException("Quiz question cannot be empty");
        }
        if (quiz.getOption1() == null || quiz.getOption1().trim().isEmpty()) {
            log.warn("Quiz option1 is empty");
            throw new InvalidQuizException("Quiz option1 cannot be empty");
        }
        if (quiz.getOption2() == null || quiz.getOption2().trim().isEmpty()) {
            log.warn("Quiz option2 is empty");
            throw new InvalidQuizException("Quiz option2 cannot be empty");
        }
        if (quiz.getOption3() == null || quiz.getOption3().trim().isEmpty()) {
            log.warn("Quiz option3 is empty");
            throw new InvalidQuizException("Quiz option3 cannot be empty");
        }
        if (quiz.getOption4() == null || quiz.getOption4().trim().isEmpty()) {
            log.warn("Quiz option4 is empty");
            throw new InvalidQuizException("Quiz option4 cannot be empty");
        }
        if (quiz.getCorrectOption() == null || quiz.getCorrectOption() < 1 || quiz.getCorrectOption() > 4) {
            log.warn("Invalid correct option: {}", quiz.getCorrectOption());
            throw new InvalidQuizException("Correct option must be between 1 and 4");
        }
    }
}