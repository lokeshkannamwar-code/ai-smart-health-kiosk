import React, { useState } from "react";

const questions = [
  "What is your main health problem today?",
  "When did this problem start?",
  "How severe is the problem on a scale of 1 to 10?",
  "Do you have any other symptoms?",
  "Have you taken any medicine for this problem?",
  "Do you have any known allergies?",
  "Do you have any existing medical conditions?"
];

function AIQuestions() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [completed, setCompleted] = useState(false);

  const handleNext = () => {
    if (!answer.trim()) {
      alert("Please enter an answer before continuing.");
      return;
    }

    const newAnswers = [
      ...answers,
      {
        question: questions[currentQuestion],
        answer: answer.trim()
      }
    ];

    setAnswers(newAnswers);
    setAnswer("");

    if (currentQuestion === questions.length - 1) {
      setCompleted(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  if (completed) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1>AI Case Taking Completed</h1>

          <p>
            Thank you. Your responses have been collected successfully.
          </p>

          <h2>Case Summary</h2>

          {answers.map((item, index) => (
            <div key={index} style={styles.summaryItem}>
              <strong>
                {index + 1}. {item.question}
              </strong>
              <p>{item.answer}</p>
            </div>
          ))}

          <button
            style={styles.button}
            onClick={() => {
              setCurrentQuestion(0);
              setAnswers([]);
              setAnswer("");
              setCompleted(false);
            }}
          >
            Start New Case
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>AI Health Assistant</h1>

        <p style={styles.progress}>
          Question {currentQuestion + 1} of {questions.length}
        </p>

        <div style={styles.questionBox}>
          <h2>{questions[currentQuestion]}</h2>
        </div>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={6}
          style={styles.textarea}
        />

        <button onClick={handleNext} style={styles.button}>
          {currentQuestion === questions.length - 1
            ? "Complete Case"
            : "Next Question"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f7fb",
    padding: "20px"
  },

  card: {
    width: "100%",
    maxWidth: "700px",
    background: "#ffffff",
    padding: "35px",
    borderRadius: "15px",
    boxShadow: "0 5px 25px rgba(0,0,0,0.1)"
  },

  progress: {
    color: "#666",
    marginBottom: "25px"
  },

  questionBox: {
    background: "#f0f6ff",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px"
  },

  textarea: {
    width: "100%",
    padding: "15px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    resize: "vertical",
    boxSizing: "border-box",
    marginBottom: "20px"
  },

  button: {
    width: "100%",
    padding: "14px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer"
  },

  summaryItem: {
    padding: "15px",
    marginBottom: "10px",
    background: "#f7f7f7",
    borderRadius: "8px"
  }
};

export default AIQuestions;