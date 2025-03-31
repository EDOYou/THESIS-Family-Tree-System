import React, { useState, useEffect } from "react";
import { fetchRandomQuiz } from "../../services/nodeService";
import "./QuizComponent.css";

const QuizComponent = ({ onQuizSuccess }) => {
  const [quiz, setQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const loadQuiz = async () => {
    try {
      const quizData = await fetchRandomQuiz();
      setQuiz(quizData);
      setError(null);
      setMessage(null);
      setSelectedOption(null);
    } catch (err) {
      setError("Failed to load quiz. Please try again.");
    }
  };

  useEffect(() => {
    loadQuiz();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedOption === null) {
      setMessage("Please select an option.");
      return;
    }

    if (parseInt(selectedOption) === quiz.correctOption) {
      setMessage("Correct! You can now view the family tree.");
      onQuizSuccess();
    } else {
      setMessage("Incorrect. Please try again with a new question.");
      setTimeout(() => {
        loadQuiz();
      }, 2000);
    }
  };

  if (!quiz) {
    return <div className="qc-loading">Loading quiz...</div>;
  }

  return (
    <div className="qc-quiz-overlay">
      <div className="qc-quiz-container">
        <h2 className="qc-quiz-title">Family History Quiz</h2>
        <p className="qc-quiz-instruction">
          You must answer this question correctly to view the family tree.
        </p>
        {error && <div className="qc-quiz-error">{error}</div>}
        {message && (
          <div
            className={
              message.includes("Correct") ? "qc-quiz-success" : "qc-quiz-error"
            }
          >
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="qc-quiz-form">
          <p className="qc-quiz-question">{quiz.question}</p>
          <div className="qc-option-group">
            <label className="qc-option-label">
              <input
                type="radio"
                name="option"
                value="1"
                checked={selectedOption === "1"}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="qc-radio-input"
              />
              <span className="qc-radio-checkmark"></span>
              {quiz.option1}
            </label>
            <label className="qc-option-label">
              <input
                type="radio"
                name="option"
                value="2"
                checked={selectedOption === "2"}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="qc-radio-input"
              />
              <span className="qc-radio-checkmark"></span>
              {quiz.option2}
            </label>
            <label className="qc-option-label">
              <input
                type="radio"
                name="option"
                value="3"
                checked={selectedOption === "3"}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="qc-radio-input"
              />
              <span className="qc-radio-checkmark"></span>
              {quiz.option3}
            </label>
            <label className="qc-option-label">
              <input
                type="radio"
                name="option"
                value="4"
                checked={selectedOption === "4"}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="qc-radio-input"
              />
              <span className="qc-radio-checkmark"></span>
              {quiz.option4}
            </label>
          </div>
          <button type="submit" className="qc-submit-button">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuizComponent;
