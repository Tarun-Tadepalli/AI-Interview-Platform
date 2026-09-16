import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  SkipForward,
  Send,
  CheckCircle2,
  AlertCircle,
  Maximize,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  LayoutDashboard,
} from "lucide-react";
import Navbar1 from "../components/Navbar1";
import "../styles/interview.css";

const questionBank = {
  technical: [
    "Explain the difference between a process and a thread.",
    "What is object-oriented programming and what are its main principles?",
    "What is the difference between SQL and NoSQL databases?",
    "Explain what an API is and how a REST API works.",
    "What happens when you enter a URL into a web browser?",
    "What is the difference between authentication and authorization?",
    "Explain the concept of caching and why it is useful.",
    "What is a database index and why is it used?",
    "Explain the difference between HTTP and HTTPS.",
    "What is a race condition in software development?",
    "Explain the concept of asynchronous programming.",
    "What is the purpose of version control systems such as Git?",
    "What is a software design pattern?",
    "Explain the difference between frontend and backend development.",
    "What is scalability in software engineering?",
  ],

  behavioral: [
    "Tell me about yourself and your background.",
    "Tell me about a challenging problem you faced and how you solved it.",
    "Describe a time when you worked as part of a team.",
    "Tell me about a mistake you made and what you learned from it.",
    "How do you handle pressure and tight deadlines?",
    "Describe a situation where you had to learn something quickly.",
    "Tell me about a time you disagreed with a teammate.",
    "What motivates you to perform well?",
    "Where do you see yourself in the next five years?",
    "Why should we hire you?",
    "What is one of your biggest strengths?",
    "What is one area you are currently trying to improve?",
    "Describe a project you are proud of.",
    "How do you prioritize multiple tasks?",
    "How do you respond to constructive criticism?",
  ],

  coding: [
    "How would you reverse a string without using a built-in reverse function?",
    "How would you find the largest element in an array?",
    "Explain how you would detect a cycle in a linked list.",
    "How would you determine whether a string is a palindrome?",
    "How would you find duplicate elements in an array?",
    "Explain the difference between an array and a linked list.",
    "How would you implement a stack using an array?",
    "How would you find the second largest number in an array?",
    "Explain the time complexity of binary search.",
    "How would you merge two sorted arrays?",
    "How would you check whether two strings are anagrams?",
    "Explain recursion with a practical example.",
    "How would you find the frequency of elements in an array?",
    "How would you implement a queue?",
    "What is the difference between BFS and DFS?",
  ],

  resume: [
    "Walk me through your resume and tell me about your background.",
    "Tell me about the most important project on your resume.",
    "What technical skills have you developed through your projects?",
    "What was your specific contribution to your strongest project?",
    "What was the most difficult technical problem you solved?",
    "Tell me about a technology mentioned on your resume that you know well.",
    "How did you test or validate your project?",
    "What would you improve if you rebuilt your project today?",
    "Tell me about your academic background.",
    "Which project best demonstrates your problem-solving ability?",
    "How did you learn the technologies used in your projects?",
    "What achievement on your resume are you most proud of?",
    "Tell me about a time your project did not work as expected.",
    "How would you explain your strongest project to a non-technical interviewer?",
    "Why are you interested in the role you are targeting?",
  ],
};

const focusLabels = {
  mixed: "Mixed",
  programming: "Programming",
  dsa: "Data Structures & Algorithms",
  web: "Web Development",
  database: "Database",
  ai: "AI / ML",
  system: "System Design",
};

function buildQuestions(type, count, difficulty, focus) {
  const bank = questionBank[type] || questionBank.technical;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, count).map((question, index) => ({
    id: `${type}-${Date.now()}-${index}`,
    number: index + 1,
    question,
    difficulty,
    focus,
    answer: "",
    answered: false,
    skipped: false,
  }));
}

function speakText(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.94;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferredVoice =
    voices.find((voice) => /en-IN/i.test(voice.lang)) ||
    voices.find((voice) => /en-US/i.test(voice.lang)) ||
    voices.find((voice) => /^en/i.test(voice.lang));

  if (preferredVoice) utterance.voice = preferredVoice;

  window.speechSynthesis.speak(utterance);
}

function getSpeechRecognition() {
  return (
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    null
  );
}

export default function Interview() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("setup");

  const [setup, setSetup] = useState({
    type: "technical",
    difficulty: "medium",
    focus: "mixed",
    count: 5,
  });

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micError, setMicError] = useState("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [skippedRound, setSkippedRound] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const recognitionRef = useRef(null);
  const answerRef = useRef("");

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!getSpeechRecognition()) {
      setSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    if (mode !== "interview") return;

    const preventRefresh = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", preventRefresh);

    return () => {
      window.removeEventListener("beforeunload", preventRefresh);
    };
  }, [mode]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!currentQuestion || mode !== "interview") return;

    setAnswerText(currentQuestion.answer || "");
    answerRef.current = currentQuestion.answer || "";
    setMicError("");
    setIsListening(false);

    const timer = setTimeout(() => {
      speakQuestion(currentQuestion.question);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentIndex, mode]);

  const speakQuestion = (question) => {
    setIsSpeaking(true);

    if (!("speechSynthesis" in window)) {
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 0.94;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsSpeaking(false);
      startListening();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((voice) => /en-IN/i.test(voice.lang)) ||
      voices.find((voice) => /en-US/i.test(voice.lang)) ||
      voices.find((voice) => /^en/i.test(voice.lang));

    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setMicError(
        "Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );
      return;
    }

    recognitionRef.current?.stop();

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setMicError("");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      const combined =
        `${answerRef.current} ${finalTranscript}`.trim();

      answerRef.current = combined;
      setAnswerText(
        `${combined}${interimTranscript ? ` ${interimTranscript}` : ""}`.trim()
      );
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setMicError(
          "Microphone permission was denied. Please allow microphone access in your browser."
        );
      } else if (event.error === "no-speech") {
        setMicError("No speech detected. You can try speaking again.");
      } else {
        setMicError("Microphone listening stopped. Please try again.");
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Browser may deny fullscreen. The interview can still continue.
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore browser fullscreen errors.
    }
  };

  const startInterview = async () => {
    const generatedQuestions = buildQuestions(
      setup.type,
      setup.count,
      setup.difficulty,
      setup.focus
    );

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setSkippedRound(false);
    setCompletedCount(0);
    setInterviewStarted(true);
    setMode("interview");

    localStorage.setItem(
      "aiInterviewSetup",
      JSON.stringify({
        ...setup,
        startedAt: new Date().toISOString(),
      })
    );

    await enterFullscreen();
  };

  const updateCurrentQuestion = (updates) => {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === currentIndex
          ? { ...question, ...updates }
          : question
      )
    );
  };

  const getNextQuestionIndex = (updatedQuestions) => {
    const unansweredIndex = updatedQuestions.findIndex(
      (question, index) =>
        index > currentIndex &&
        !question.answered &&
        !question.skipped
    );

    if (unansweredIndex !== -1) return unansweredIndex;

    const fromBeginning = updatedQuestions.findIndex(
      (question) =>
        !question.answered && !question.skipped
    );

    if (fromBeginning !== -1) return fromBeginning;

    return -1;
  };

  const getNextSkippedIndex = (updatedQuestions) => {
    const nextSkipped = updatedQuestions.findIndex(
      (question) => question.skipped && !question.answered
    );

    return nextSkipped;
  };

  const submitAnswer = () => {
    stopListening();
    window.speechSynthesis?.cancel();

    const finalAnswer = answerRef.current.trim();

    if (!finalAnswer) {
      setMicError("Please answer the question before submitting.");
      return;
    }

    const updatedQuestions = questions.map((question, index) =>
      index === currentIndex
        ? {
            ...question,
            answer: finalAnswer,
            answered: true,
            skipped: false,
          }
        : question
    );

    setQuestions(updatedQuestions);
    setCompletedCount(
      updatedQuestions.filter((question) => question.answered).length
    );

    const nextNormal = getNextQuestionIndex(updatedQuestions);

    if (nextNormal !== -1) {
      setCurrentIndex(nextNormal);
      return;
    }

    const nextSkipped = getNextSkippedIndex(updatedQuestions);

    if (nextSkipped !== -1) {
      setSkippedRound(true);
      setCurrentIndex(nextSkipped);
      return;
    }

    finishInterview(updatedQuestions);
  };

  const skipQuestion = () => {
    stopListening();
    window.speechSynthesis?.cancel();

    const updatedQuestions = questions.map((question, index) =>
      index === currentIndex
        ? {
            ...question,
            skipped: true,
            answered: false,
            answer: "",
          }
        : question
    );

    setQuestions(updatedQuestions);

    const nextNormal = getNextQuestionIndex(updatedQuestions);

    if (nextNormal !== -1) {
      setCurrentIndex(nextNormal);
      return;
    }

    const nextSkipped = getNextSkippedIndex(updatedQuestions);

    if (nextSkipped !== -1) {
      setSkippedRound(true);
      setCurrentIndex(nextSkipped);
      return;
    }

    finishInterview(updatedQuestions);
  };

  const finishInterview = async (finalQuestions) => {
    stopListening();
    window.speechSynthesis?.cancel();
    await exitFullscreen();

    localStorage.setItem(
      "aiInterviewLastResult",
      JSON.stringify({
        completedAt: new Date().toISOString(),
        setup,
        questions: finalQuestions,
      })
    );

    setQuestions(finalQuestions);
    setMode("results");
  };

  const restartInterview = () => {
    setMode("setup");
    setQuestions([]);
    setCurrentIndex(0);
    setAnswerText("");
    answerRef.current = "";
    setSkippedRound(false);
    setInterviewStarted(false);
    setCompletedCount(0);
  };

  if (mode === "setup") {
    return (
      <Navbar1>
        <main className="app-content interview-content">
          <section className="interview-page">
            <div className="interview-heading">
              <div>
                <span className="section-kicker">AI INTERVIEW</span>
                <h1>Start Your AI Interview</h1>
                <p>
                  Configure your interview and let the AI interviewer guide
                  you through the session using voice.
                </p>
              </div>
            </div>

            <div className="interview-setup-grid">
              <div className="setup-card">
                <div className="setup-card-header">
                  <div className="setup-icon">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h2>Interview Configuration</h2>
                    <p>Choose how you want your interview to be conducted.</p>
                  </div>
                </div>

                <div className="setup-fields">
                  <label>
                    <span>Interview Type</span>
                    <select
                      value={setup.type}
                      onChange={(event) =>
                        setSetup({
                          ...setup,
                          type: event.target.value,
                        })
                      }
                    >
                      <option value="technical">Technical</option>
                      <option value="behavioral">Behavioral</option>
                      <option value="coding">Coding</option>
                      <option value="resume">Resume Based</option>
                    </select>
                  </label>

                  <label>
                    <span>Difficulty</span>
                    <select
                      value={setup.difficulty}
                      onChange={(event) =>
                        setSetup({
                          ...setup,
                          difficulty: event.target.value,
                        })
                      }
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>

                  <label>
                    <span>Interview Focus</span>
                    <select
                      value={setup.focus}
                      onChange={(event) =>
                        setSetup({
                          ...setup,
                          focus: event.target.value,
                        })
                      }
                    >
                      <option value="mixed">Mixed</option>
                      <option value="programming">Programming</option>
                      <option value="dsa">Data Structures & Algorithms</option>
                      <option value="web">Web Development</option>
                      <option value="database">Database</option>
                      <option value="ai">AI / ML</option>
                      <option value="system">System Design</option>
                    </select>
                  </label>

                  <label>
                    <span>Number of Questions</span>
                    <select
                      value={setup.count}
                      onChange={(event) =>
                        setSetup({
                          ...setup,
                          count: Number(event.target.value),
                        })
                      }
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                    </select>
                  </label>
                </div>

                <button
                  className="start-interview-button"
                  onClick={startInterview}
                >
                  <Mic size={20} />
                  Start Interview
                </button>
              </div>

              <div className="interview-info-card">
                <div className="ai-preview">
                  <div className="ai-preview-circle">
                    <Sparkles size={30} />
                  </div>

                  <div className="preview-waves">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <h2>Voice-First AI Interview</h2>

                <p>
                  Your interview is designed like a real conversation with an
                  AI interviewer.
                </p>

                <div className="info-list">
                  <div>
                    <CheckCircle2 size={18} />
                    <span>AI asks questions by voice</span>
                  </div>

                  <div>
                    <CheckCircle2 size={18} />
                    <span>You answer using your microphone</span>
                  </div>

                  <div>
                    <CheckCircle2 size={18} />
                    <span>Questions can be skipped and revisited</span>
                  </div>

                  <div>
                    <ShieldCheck size={18} />
                    <span>Interview mode keeps your session focused</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </Navbar1>
    );
  }

  if (mode === "interview" && currentQuestion) {
    const answered = questions.filter(
      (question) => question.answered
    ).length;

    const skipped = questions.filter(
      (question) => question.skipped && !question.answered
    ).length;

    const progress =
      ((answered + skipped) / questions.length) * 100;

    return (
      <main className="locked-interview">
        <div className="locked-topbar">
          <div className="locked-brand">
            <div className="locked-brand-mark">
              <Sparkles size={18} />
            </div>
            <span>AI Interview Platform</span>
          </div>

          <div className="locked-security">
            <ShieldCheck size={16} />
            Interview in progress
          </div>
        </div>

        <div className="locked-progress">
          <div className="locked-progress-text">
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>

            <span>
              {skipped > 0 && `${skipped} skipped`}
            </span>
          </div>

          <div className="locked-progress-track">
            <div
              className="locked-progress-fill"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <section className="voice-interview-card">
          {currentQuestion.skipped && (
            <div className="skipped-badge">
              <SkipForward size={15} />
              SKIPPED QUESTION
            </div>
          )}

          <div className="ai-interviewer">
            <div
              className={`ai-wave-container ${
                isListening ? "listening" : ""
              } ${isSpeaking ? "speaking" : ""}`}
            >
              <div className="voice-waves">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="ai-core">
                <Sparkles size={34} />
              </div>
            </div>

            <div className="ai-status">
              {isSpeaking
                ? "AI is asking the question..."
                : isListening
                ? "Listening to your answer..."
                : "Ready"}
            </div>
          </div>

          <div className="question-section">
            <span className="question-label">
              {currentQuestion.skipped
                ? "RETURNING TO SKIPPED QUESTION"
                : "AI INTERVIEWER"}
            </span>

            <h1>{currentQuestion.question}</h1>

            <div className="question-meta">
              <span>
                {setup.difficulty.charAt(0).toUpperCase() +
                  setup.difficulty.slice(1)}
              </span>
              <span>{focusLabels[setup.focus]}</span>
            </div>
          </div>

          <div className="voice-answer-area">
            <div
              className={`microphone-state ${
                isListening ? "active" : ""
              }`}
            >
              {isListening ? (
                <>
                  <div className="mic-pulse">
                    <Mic size={24} />
                  </div>
                  <div>
                    <strong>Listening...</strong>
                    <p>Speak naturally. Your answer is being captured.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mic-idle">
                    <MicOff size={22} />
                  </div>
                  <div>
                    <strong>
                      {isSpeaking
                        ? "AI is speaking..."
                        : "Microphone ready"}
                    </strong>
                    <p>
                      {isSpeaking
                        ? "Listen to the question."
                        : "Your spoken answer will be transcribed automatically."}
                    </p>
                  </div>
                </>
              )}
            </div>

            {answerText && (
              <div className="transcript-preview">
                <span>Your answer</span>
                <p>{answerText}</p>
              </div>
            )}

            {micError && (
              <div className="microphone-error">
                <AlertCircle size={17} />
                {micError}
              </div>
            )}

            {!speechSupported && (
              <div className="browser-warning">
                Voice recognition is not available in this browser. For the
                best experience, use Google Chrome or Microsoft Edge.
              </div>
            )}
          </div>

          <div className="interview-controls">
            <button
              className="skip-button"
              onClick={skipQuestion}
              disabled={isSpeaking}
            >
              <SkipForward size={19} />
              Skip Question
            </button>

            <div className="control-right">
              {!isListening && !isSpeaking && (
                <button
                  className="listen-again-button"
                  onClick={() => speakQuestion(currentQuestion.question)}
                >
                  <RotateCcw size={18} />
                  Hear Again
                </button>
              )}

              {isListening && (
                <button
                  className="stop-listening-button"
                  onClick={stopListening}
                >
                  <MicOff size={18} />
                  Stop Listening
                </button>
              )}

              <button
                className="submit-answer-button"
                onClick={submitAnswer}
                disabled={isSpeaking || !answerText.trim()}
              >
                <Send size={18} />
                Submit & Continue
              </button>
            </div>
          </div>
        </section>

        <div className="locked-footer">
          <span>
            {answered} answered · {skipped} skipped
          </span>

          <span>
            Do not close or refresh this window while the interview is in
            progress.
          </span>
        </div>
      </main>
    );
  }

  if (mode === "results") {
    const answeredQuestions = questions.filter(
      (question) => question.answered
    );

    return (
      <Navbar1>
        <main className="app-content interview-content">
          <section className="interview-results-page">
            <div className="results-success-icon">
              <CheckCircle2 size={38} />
            </div>

            <span className="section-kicker">INTERVIEW COMPLETED</span>

            <h1>Your AI Interview is Complete</h1>

            <p className="results-description">
              You have completed all interview questions. AI-powered
              evaluation and personalized feedback will appear here once the
              Gemini evaluation service is connected.
            </p>

            <div className="results-summary-grid">
              <div>
                <span>Total Questions</span>
                <strong>{questions.length}</strong>
              </div>

              <div>
                <span>Answered</span>
                <strong>{answeredQuestions.length}</strong>
              </div>

              <div>
                <span>Skipped</span>
                <strong>
                  {questions.filter((question) => question.skipped).length}
                </strong>
              </div>

              <div>
                <span>Interview Type</span>
                <strong>
                  {setup.type.charAt(0).toUpperCase() +
                    setup.type.slice(1)}
                </strong>
              </div>
            </div>

            <div className="ai-evaluation-placeholder">
              <div className="evaluation-icon">
                <Sparkles size={25} />
              </div>

              <div>
                <h2>AI Evaluation</h2>
                <p>
                  Gemini will evaluate your answers for correctness,
                  communication, relevance, confidence, and overall interview
                  performance.
                </p>
              </div>
            </div>

            <div className="results-actions">
              <button
                className="secondary-results-button"
                onClick={restartInterview}
              >
                <RotateCcw size={18} />
                Start New Interview
              </button>

              <button
                className="primary-results-button"
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard size={18} />
                Go to Dashboard
              </button>
            </div>
          </section>
        </main>
      </Navbar1>
    );
  }

  return null;
}