import React, { useState, useEffect } from "react";
import { fetchRandomQuiz } from "../../services/nodeService";

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
    return <div>Loading quiz...</div>;
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Family History Quiz</h2>
      <p>You must answer this question correctly to view the family tree.</p>
      {error && (
        <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
      )}
      {message && (
        <div
          style={{
            color: message.includes("Correct") ? "green" : "red",
            marginBottom: "10px",
          }}
        >
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <p>{quiz.question}</p>
        <div>
          <label>
            <input
              type="radio"
              name="option"
              value="1"
              checked={selectedOption === "1"}
              onChange={(e) => setSelectedOption(e.target.value)}
            />
            {quiz.option1}
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="option"
              value="2"
              checked={selectedOption === "2"}
              onChange={(e) => setSelectedOption(e.target.value)}
            />
            {quiz.option2}
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="option"
              value="3"
              checked={selectedOption === "3"}
              onChange={(e) => setSelectedOption(e.target.value)}
            />
            {quiz.option3}
          </label>
        </div>
        <div>
          <label>
            <input
              type="radio"
              name="option"
              value="4"
              checked={selectedOption === "4"}
              onChange={(e) => setSelectedOption(e.target.value)}
            />
            {quiz.option4}
          </label>
        </div>
        <button type="submit" style={{ marginTop: "10px" }}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default QuizComponent;
