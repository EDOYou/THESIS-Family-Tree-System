package com.familytree.service;

import com.familytree.exception.InvalidQuizException;
import com.familytree.exception.QuizNotFoundException;
import com.familytree.exception.UnauthenticatedException;
import com.familytree.exception.UserNotFoundException;
import com.familytree.exception.UnauthorizedException;
import com.familytree.model.Quiz;
import com.familytree.model.User;
import com.familytree.repository.QuizRepository;
import com.familytree.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class QuizServiceTest {

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private QuizService quizService;

    private Quiz quiz;
    private User user;
    private Long quizId;
    private Long userId;

    @BeforeEach
    public void setUp() {
        quizId = 1L;
        userId = 1L;

        user = new User();
        user.setId(userId);
        user.setUsername("testuser");

        quiz = new Quiz();
        quiz.setId(quizId);
        quiz.setQuestion("What is 2+2?");
        quiz.setOption1("1");
        quiz.setOption2("2");
        quiz.setOption3("3");
        quiz.setOption4("4");
        quiz.setCorrectOption(4);
        quiz.setCreatedBy(userId);
    }

    @Test
    public void testCreateQuiz_Success() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(quizRepository.save(any(Quiz.class))).thenReturn(quiz);

        Quiz result = quizService.createQuiz(quiz);
        assertEquals(quizId, result.getId());
        assertEquals("What is 2+2?", result.getQuestion());
        assertEquals(userId, result.getCreatedBy());
    }

    @Test
    public void testCreateQuiz_EmptyQuestion() {
        quiz.setQuestion("");
        assertThrows(InvalidQuizException.class, () -> quizService.createQuiz(quiz));
    }

    @Test
    public void testCreateQuiz_EmptyOption1() {
        quiz.setOption1("");
        assertThrows(InvalidQuizException.class, () -> quizService.createQuiz(quiz));
    }

    @Test
    public void testCreateQuiz_EmptyOption2() {
        quiz.setOption2("");
        assertThrows(InvalidQuizException.class, () -> quizService.createQuiz(quiz));
    }

    @Test
    public void testCreateQuiz_EmptyOption3() {
        quiz.setOption3("");
        assertThrows(InvalidQuizException.class, () -> quizService.createQuiz(quiz));
    }

    @Test
    public void testCreateQuiz_EmptyOption4() {
        quiz.setOption4("");
        assertThrows(InvalidQuizException.class, () -> quizService.createQuiz(quiz));
    }

    @Test
    public void testCreateQuiz_InvalidCorrectOption() {
        quiz.setCorrectOption(5);
        assertThrows(InvalidQuizException.class, () -> quizService.createQuiz(quiz));
    }

    @Test
    public void testCreateQuiz_NotAuthenticated() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(false);

        assertThrows(UnauthenticatedException.class, () -> quizService.createQuiz(quiz));
    }

    @Test
    public void testCreateQuiz_UserNotFound() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> quizService.createQuiz(quiz));
    }

    @Test
    public void testGetAllQuizzes_Success() {
        when(quizRepository.findAll()).thenReturn(Arrays.asList(quiz));

        var result = quizService.getAllQuizzes();
        assertEquals(1, result.size());
        assertEquals(quizId, result.get(0).getId());
    }

    @Test
    public void testGetAllQuizzes_EmptyList() {
        when(quizRepository.findAll()).thenReturn(Collections.emptyList());

        var result = quizService.getAllQuizzes();
        assertTrue(result.isEmpty());
    }

    @Test
    public void testGetRandomQuiz_Success() {
        when(quizRepository.findAll()).thenReturn(Arrays.asList(quiz));

        Quiz result = quizService.getRandomQuiz();
        assertEquals(quizId, result.getId());
    }

    @Test
    public void testGetRandomQuiz_NoQuizzes() {
        when(quizRepository.findAll()).thenReturn(Collections.emptyList());

        assertThrows(QuizNotFoundException.class, () -> quizService.getRandomQuiz());
    }

    @Test
    public void testUpdateQuiz_Success() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(quizRepository.findById(quizId)).thenReturn(Optional.of(quiz));
        when(quizRepository.save(any(Quiz.class))).thenReturn(quiz);

        Quiz updatedQuiz = new Quiz();
        updatedQuiz.setQuestion("What is 3+3?");
        updatedQuiz.setOption1("1");
        updatedQuiz.setOption2("2");
        updatedQuiz.setOption3("3");
        updatedQuiz.setOption4("6");
        updatedQuiz.setCorrectOption(4);

        Quiz result = quizService.updateQuiz(quizId, updatedQuiz);
        assertEquals("What is 3+3?", result.getQuestion());
        assertEquals("6", result.getOption4());
        assertEquals(4, result.getCorrectOption());
    }

    @Test
    public void testUpdateQuiz_Unauthorized() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("otheruser");

        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("otheruser");

        when(userRepository.findByUsername("otheruser")).thenReturn(Optional.of(otherUser));
        when(quizRepository.findById(quizId)).thenReturn(Optional.of(quiz));

        assertThrows(UnauthorizedException.class, () -> quizService.updateQuiz(quizId, quiz));
    }

    @Test
    public void testDeleteQuiz_Success() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(quizRepository.findById(quizId)).thenReturn(Optional.of(quiz));

        quizService.deleteQuiz(quizId);
        verify(quizRepository).delete(quiz);
    }


    @Test
    public void testDeleteQuiz_Unauthorized() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("otheruser");

        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("otheruser");

        when(userRepository.findByUsername("otheruser")).thenReturn(Optional.of(otherUser));
        when(quizRepository.findById(quizId)).thenReturn(Optional.of(quiz));

        assertThrows(UnauthorizedException.class, () -> quizService.deleteQuiz(quizId));
    }
}