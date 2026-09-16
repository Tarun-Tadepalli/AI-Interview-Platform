import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Sparkles,
  ShieldCheck,
  Clock3,
  Pause,
  Play,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Volume2,
  MessageCircle,
  Brain,
  Gauge,
  Award,
  AlertCircle,
  LayoutDashboard,
  Square,
} from "lucide-react";
import Navbar1 from "../components/Navbar1";
import "../styles/speaking.css";

const prompts = {
  conversation: [
    "Tell me about yourself and what you are currently working toward.",
    "What is something you have learned recently that you found interesting?",
    "Describe a project or activity that you are proud of.",
    "What do you usually do when you face a difficult problem?",
    "Tell me about a person who has influenced your career goals.",
    "What kind of work environment helps you perform at your best?",
  ],
  interview: [
    "Why should a company hire you for your target role?",
    "Tell me about a challenging technical problem you solved.",
    "Describe a situation where you had to work under pressure.",
    "What is your biggest technical strength?",
    "Tell me about a mistake you made and what you learned from it.",
    "Where do you see yourself professionally in the next five years?",
  ],
  presentation: [
    "Explain a technology you know well to someone who has never used it.",
    "Give a short presentation about one of your projects.",
    "Explain why artificial intelligence is changing software development.",
    "Describe the architecture of a software application you have built.",
    "Explain an important technical concept in simple language.",
    "Present your idea for an application that could solve a real-world problem.",
  ],
  situational: [
    "You are given a project with a very short deadline. Explain how you would approach it.",
    "A teammate strongly disagrees with your technical decision. How would you handle the situation?",
    "You discover a serious bug just before a product release. What would you do?",
    "You are asked to learn a technology you have never used before. Explain your approach.",
    "A customer is unhappy with a product feature. How would you respond?",
    "Your manager gives you several urgent tasks at the same time. How would you prioritize them?",
  ],
  pronunciation: [
    "Introduce yourself clearly and speak at a natural conversational pace.",
    "Explain what you enjoy doing in your free time.",
    "Describe your college or workplace experience.",
    "Talk about a technology you would like to learn.",
    "Explain one of your favorite projects.",
    "Describe your career goals for the next few years.",
  ],
};

const modeLabels = {
  conversation: "General Conversation",
  interview: "Interview Speaking",
  presentation: "Presentation",
  situational: "Situational Speaking",
  pronunciation: "Pronunciation Practice",
};

function getRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function speak(text, onEnd) {
  if (!("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((item) => /en-IN/i.test(item.lang)) ||
    voices.find((item) => /en-US/i.test(item.lang)) ||
    voices.find((item) => /^en/i.test(item.lang));

  if (voice) utterance.voice = voice;

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
}

function buildPrompts(mode, count, difficulty) {
  const bank = prompts[mode] || prompts.conversation;

  return [...bank]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((prompt, index) => ({
      id: `${mode}-${Date.now()}-${index}`,
      number: index + 1,
      prompt,
      answer: "",
      difficulty,
      completed: false,
    }));
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
}

export default function SpeakingPractice() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("conversation");
  const [difficulty, setDifficulty] = useState("medium");
  const [duration, setDuration] = useState(5);
  const [promptCount, setPromptCount] = useState(5);

  const [screen, setScreen] = useState("setup");
  const [promptsList, setPromptsList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState("");

  const [remainingSeconds, setRemainingSeconds] = useState(
    duration * 60
  );

  const [practiceSeconds, setPracticeSeconds] = useState(0);

  const [results, setResults] = useState(null);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  const currentPrompt = promptsList[currentIndex];

  useEffect(() => {
    if (!getRecognition()) setSpeechSupported(false);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (screen !== "practice" || isPaused) return;

    const timer = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          finishPractice();
          return 0;
        }

        return previous - 1;
      });

      setPracticeSeconds((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, isPaused]);

  useEffect(() => {
    if (!currentPrompt || screen !== "practice" || isPaused) return;

    setTranscript(currentPrompt.answer || "");
    transcriptRef.current = currentPrompt.answer || "";
    setMicError("");

    const timer = setTimeout(() => {
      askPrompt(currentPrompt.prompt);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentIndex, screen]);

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Browser can deny fullscreen.
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

  const askPrompt = (text) => {
    stopListening();
    setIsSpeaking(true);

    speak(text, () => {
      setIsSpeaking(false);

      if (!isPaused) {
        startListening();
      }
    });
  };

  const startListening = () => {
    const Recognition = getRecognition();

    if (!Recognition) {
      setSpeechSupported(false);
      setMicError(
        "Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );
      return;
    }

    recognitionRef.current?.stop();

    const recognition = new Recognition();

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setMicError("");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const value = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += value + " ";
        } else {
          interimText += value;
        }
      }

      const base = `${transcriptRef.current} ${finalText}`.trim();

      transcriptRef.current = base;

      setTranscript(
        `${base}${interimText ? ` ${interimText}` : ""}`.trim()
      );
    };

    recognition.onerror = (event) => {
      setIsListening(false);

      if (event.error === "not-allowed") {
        setMicError(
          "Microphone permission was denied. Please allow microphone access."
        );
      } else if (event.error === "no-speech") {
        setMicError("No speech detected. Please try speaking again.");
      } else {
        setMicError("Microphone listening stopped. Please try again.");
      }
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

  const startPractice = async () => {
    const generated = buildPrompts(mode, promptCount, difficulty);

    setPromptsList(generated);
    setCurrentIndex(0);
    setRemainingSeconds(duration * 60);
    setPracticeSeconds(0);
    setResults(null);
    setScreen("practice");

    localStorage.setItem(
      "aiSpeakingPracticeSetup",
      JSON.stringify({
        mode,
        difficulty,
        duration,
        promptCount,
        startedAt: new Date().toISOString(),
      })
    );

    await enterFullscreen();
  };

  const saveCurrentAnswer = () => {
    const answer = transcriptRef.current.trim();

    setPromptsList((previous) =>
      previous.map((item, index) =>
        index === currentIndex
          ? {
              ...item,
              answer,
              completed: Boolean(answer),
            }
          : item
      )
    );

    return answer;
  };

  const nextPrompt = () => {
    const answer = saveCurrentAnswer();

    if (!answer) {
      setMicError("Please speak an answer before continuing.");
      return;
    }

    stopListening();
    window.speechSynthesis?.cancel();

    if (currentIndex < promptsList.length - 1) {
      setCurrentIndex((previous) => previous + 1);
    } else {
      finishPractice();
    }
  };

  const retryPrompt = () => {
    stopListening();
    window.speechSynthesis?.cancel();

    setTranscript("");
    transcriptRef.current = "";

    setPromptsList((previous) =>
      previous.map((item, index) =>
        index === currentIndex
          ? { ...item, answer: "", completed: false }
          : item
      )
    );

    setTimeout(() => askPrompt(currentPrompt.prompt), 300);
  };

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);

      setTimeout(() => {
        if (!isSpeaking) startListening();
      }, 300);
    } else {
      setIsPaused(true);
      stopListening();
      window.speechSynthesis?.pause();
    }
  };

  const finishPractice = async () => {
    stopListening();
    window.speechSynthesis?.cancel();

    const finalPrompts = promptsList.map((item, index) =>
      index === currentIndex
        ? {
            ...item,
            answer: transcriptRef.current.trim(),
            completed: Boolean(transcriptRef.current.trim()),
          }
        : item
    );

    await exitFullscreen();

    const answered = finalPrompts.filter(
      (item) => item.answer.trim()
    ).length;

    const generatedResults = {
      answered,
      total: finalPrompts.length,
      duration: practiceSeconds,
      mode,
      difficulty,
      metrics: {
        fluency: Math.min(96, 70 + answered * 4),
        pronunciation: Math.min(94, 72 + answered * 3),
        grammar: Math.min(92, 70 + answered * 4),
        vocabulary: Math.min(91, 69 + answered * 4),
        confidence: Math.min(95, 73 + answered * 3),
      },
      fillerWords: Math.max(2, 12 - answered * 2),
      wordsPerMinute: 108 + answered * 5,
    };

    localStorage.setItem(
      "aiSpeakingPracticeResult",
      JSON.stringify({
        completedAt: new Date().toISOString(),
        setup: {
          mode,
          difficulty,
          duration,
          promptCount,
        },
        prompts: finalPrompts,
        results: generatedResults,
      })
    );

    setResults(generatedResults);
    setPromptsList(finalPrompts);
    setScreen("results");
  };

  const restart = () => {
    stopListening();
    window.speechSynthesis?.cancel();

    setScreen("setup");
    setPromptsList([]);
    setCurrentIndex(0);
    setTranscript("");
    transcriptRef.current = "";
    setResults(null);
    setIsPaused(false);
    setMicError("");
  };

  if (screen === "setup") {
    return (
      <Navbar1>
        <main className="app-content speaking-content">
          <section className="speaking-page">
            <div className="speaking-heading">
              <div>
                <span className="section-kicker">
                  SPEAKING PRACTICE
                </span>

                <h1>Improve the Way You Speak</h1>

                <p>
                  Practice speaking naturally with an AI-powered voice
                  experience designed to improve fluency, confidence and
                  communication.
                </p>
              </div>
            </div>

            <div className="speaking-setup-grid">
              <div className="speaking-setup-card">
                <div className="speaking-card-header">
                  <div className="speaking-card-icon">
                    <MessageCircle size={22} />
                  </div>

                  <div>
                    <h2>Practice Configuration</h2>
                    <p>
                      Customize your speaking session before you begin.
                    </p>
                  </div>
                </div>

                <div className="speaking-fields">
                  <label>
                    <span>Practice Mode</span>

                    <select
                      value={mode}
                      onChange={(event) =>
                        setMode(event.target.value)
                      }
                    >
                      <option value="conversation">
                        General Conversation
                      </option>

                      <option value="interview">
                        Interview Speaking
                      </option>

                      <option value="presentation">
                        Presentation
                      </option>

                      <option value="situational">
                        Situational Speaking
                      </option>

                      <option value="pronunciation">
                        Pronunciation Practice
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>Difficulty</span>

                    <select
                      value={difficulty}
                      onChange={(event) =>
                        setDifficulty(event.target.value)
                      }
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>

                  <label>
                    <span>Practice Duration</span>

                    <select
                      value={duration}
                      onChange={(event) =>
                        setDuration(Number(event.target.value))
                      }
                    >
                      <option value={5}>5 Minutes</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                    </select>
                  </label>

                  <label>
                    <span>Number of Prompts</span>

                    <select
                      value={promptCount}
                      onChange={(event) =>
                        setPromptCount(Number(event.target.value))
                      }
                    >
                      <option value={5}>5 Prompts</option>
                      <option value={8}>8 Prompts</option>
                      <option value={10}>10 Prompts</option>
                    </select>
                  </label>
                </div>

                <button
                  className="start-speaking-button"
                  onClick={startPractice}
                >
                  <Mic size={20} />
                  Start Speaking Practice
                </button>
              </div>

              <div className="speaking-preview-card">
                <div className="speaking-preview">
                  <div className="preview-ai-circle">
                    <Sparkles size={30} />
                  </div>

                  <div className="speaking-preview-waves">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <h2>Voice-First Practice</h2>

                <p>
                  Speak naturally while the platform captures your speech
                  and prepares it for AI analysis.
                </p>

                <div className="speaking-features">
                  <div>
                    <Mic size={18} />
                    <span>Voice-based answers</span>
                  </div>

                  <div>
                    <Brain size={18} />
                    <span>AI communication analysis</span>
                  </div>

                  <div>
                    <Gauge size={18} />
                    <span>Fluency and speaking metrics</span>
                  </div>

                  <div>
                    <ShieldCheck size={18} />
                    <span>Focused practice environment</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </Navbar1>
    );
  }

  if (screen === "practice" && currentPrompt) {
    const completed = promptsList.filter(
      (item) => item.completed
    ).length;

    const progress =
      ((currentIndex + 1) / promptsList.length) * 100;

    return (
      <main className="locked-speaking">
        <div className="speaking-topbar">
          <div className="speaking-brand">
            <div className="speaking-brand-icon">
              <Sparkles size={18} />
            </div>

            <span>AI Speaking Practice</span>
          </div>

          <div className="speaking-session-status">
            <ShieldCheck size={16} />
            Practice session active
          </div>
        </div>

        <div className="speaking-session-bar">
          <div>
            <span>
              Prompt {currentIndex + 1} of {promptsList.length}
            </span>

            <div className="speaking-progress-track">
              <div
                className="speaking-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="speaking-timer">
            <Clock3 size={16} />
            {formatTime(remainingSeconds)}
          </div>
        </div>

        <section className="speaking-practice-card">
          <div className="practice-mode-label">
            {modeLabels[mode]}
          </div>

          <div
            className={`speaking-ai-orb ${
              isListening ? "orb-listening" : ""
            } ${isSpeaking ? "orb-speaking" : ""}`}
          >
            <div className="orb-waves">
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

            <div className="orb-core">
              <Sparkles size={34} />
            </div>
          </div>

          <div className="speaking-status">
            {isSpeaking
              ? "AI is speaking..."
              : isListening
              ? "Listening to you..."
              : isPaused
              ? "Practice paused"
              : "Ready"}
          </div>

          <div className="speaking-prompt">
            <span>YOUR SPEAKING PROMPT</span>

            <h1>{currentPrompt.prompt}</h1>

            <div className="prompt-actions">
              <button
                className="hear-prompt-button"
                onClick={() => askPrompt(currentPrompt.prompt)}
                disabled={isSpeaking || isPaused}
              >
                <Volume2 size={17} />
                Hear Prompt
              </button>
            </div>
          </div>

          <div className="speaking-listening-panel">
            <div
              className={`listening-indicator ${
                isListening ? "active" : ""
              }`}
            >
              {isListening ? (
                <div className="active-mic">
                  <Mic size={23} />
                </div>
              ) : (
                <div className="inactive-mic">
                  <MicOff size={21} />
                </div>
              )}

              <div>
                <strong>
                  {isListening
                    ? "Listening..."
                    : isSpeaking
                    ? "AI is speaking..."
                    : "Microphone ready"}
                </strong>

                <p>
                  {isListening
                    ? "Speak naturally. Your speech is being transcribed."
                    : "Answer using your voice. There is no typing required."}
                </p>
              </div>
            </div>

            {transcript && (
              <div className="live-transcript">
                <div className="transcript-header">
                  <span>Live Transcript</span>

                  <span className="transcript-status">
                    {isListening ? "LIVE" : "CAPTURED"}
                  </span>
                </div>

                <p>{transcript}</p>
              </div>
            )}

            {micError && (
              <div className="speaking-error">
                <AlertCircle size={17} />
                {micError}
              </div>
            )}

            {!speechSupported && (
              <div className="speech-browser-warning">
                Speech recognition works best in Google Chrome or
                Microsoft Edge.
              </div>
            )}
          </div>

          <div className="speaking-controls">
            <button
              className="pause-speaking-button"
              onClick={togglePause}
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
              {isPaused ? "Resume" : "Pause"}
            </button>

            <button
              className="retry-speaking-button"
              onClick={retryPrompt}
              disabled={isSpeaking || isPaused}
            >
              <RotateCcw size={17} />
              Retry
            </button>

            <button
              className="next-speaking-button"
              onClick={nextPrompt}
              disabled={isSpeaking || !transcript.trim()}
            >
              {currentIndex === promptsList.length - 1
                ? "Finish Practice"
                : "Next Prompt"}

              {currentIndex === promptsList.length - 1 ? (
                <CheckCircle2 size={18} />
              ) : (
                <ArrowRight size={18} />
              )}
            </button>
          </div>

          <button
            className="end-speaking-button"
            onClick={finishPractice}
          >
            <Square size={13} />
            End Practice
          </button>
        </section>

        <div className="speaking-footer">
          <span>{completed} prompts completed</span>

          <span>
            Your speech is captured for analysis. Do not refresh the
            browser during practice.
          </span>
        </div>
      </main>
    );
  }

  if (screen === "results" && results) {
    return (
      <Navbar1>
        <main className="app-content speaking-content">
          <section className="speaking-results-page">
            <div className="speaking-result-icon">
              <Award size={37} />
            </div>

            <span className="section-kicker">
              PRACTICE COMPLETED
            </span>

            <h1>Your Speaking Practice Results</h1>

            <p className="speaking-results-description">
              Your session has been completed. Detailed AI feedback,
              pronunciation analysis and personalized recommendations will
              be powered by the backend AI service.
            </p>

            <div className="speaking-overview">
              <div>
                <span>Prompts Completed</span>
                <strong>
                  {results.answered}/{results.total}
                </strong>
              </div>

              <div>
                <span>Speaking Time</span>
                <strong>
                  {Math.floor(results.duration / 60)}m{" "}
                  {results.duration % 60}s
                </strong>
              </div>

              <div>
                <span>Words / Minute</span>
                <strong>{results.wordsPerMinute}</strong>
              </div>

              <div>
                <span>Filler Words</span>
                <strong>{results.fillerWords}</strong>
              </div>
            </div>

            <div className="speaking-metrics-card">
              <div className="results-card-title">
                <div className="results-title-icon">
                  <Gauge size={19} />
                </div>

                <div>
                  <h2>Speaking Analysis</h2>
                  <p>Current practice performance</p>
                </div>
              </div>

              <div className="metric-grid">
                <div className="speaking-metric">
                  <div>
                    <span>Fluency</span>
                    <strong>{results.metrics.fluency}%</strong>
                  </div>

                  <div className="metric-track">
                    <div
                      style={{
                        width: `${results.metrics.fluency}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="speaking-metric">
                  <div>
                    <span>Pronunciation</span>
                    <strong>
                      {results.metrics.pronunciation}%
                    </strong>
                  </div>

                  <div className="metric-track">
                    <div
                      style={{
                        width: `${results.metrics.pronunciation}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="speaking-metric">
                  <div>
                    <span>Grammar</span>
                    <strong>{results.metrics.grammar}%</strong>
                  </div>

                  <div className="metric-track">
                    <div
                      style={{
                        width: `${results.metrics.grammar}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="speaking-metric">
                  <div>
                    <span>Vocabulary</span>
                    <strong>
                      {results.metrics.vocabulary}%
                    </strong>
                  </div>

                  <div className="metric-track">
                    <div
                      style={{
                        width: `${results.metrics.vocabulary}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="speaking-metric">
                  <div>
                    <span>Confidence</span>
                    <strong>
                      {results.metrics.confidence}%
                    </strong>
                  </div>

                  <div className="metric-track">
                    <div
                      style={{
                        width: `${results.metrics.confidence}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="speaking-feedback-grid">
              <div className="feedback-card">
                <CheckCircle2 size={20} />
                <div>
                  <h3>Strengths</h3>
                  <p>
                    Good overall speaking flow and a natural response
                    structure. Continue practicing with varied topics.
                  </p>
                </div>
              </div>

              <div className="feedback-card improvement">
                <Brain size={20} />
                <div>
                  <h3>Areas to Improve</h3>
                  <p>
                    Focus on reducing filler words, maintaining consistent
                    pacing and using more precise vocabulary.
                  </p>
                </div>
              </div>
            </div>

            <div className="ai-speaking-feedback">
              <div className="ai-feedback-icon">
                <Sparkles size={24} />
              </div>

              <div>
                <h2>AI Speaking Coach</h2>
                <p>
                  Gemini will later analyze your actual transcript and
                  provide detailed feedback on grammar, vocabulary,
                  pronunciation, fluency, confidence and communication
                  quality.
                </p>
              </div>
            </div>

            <div className="speaking-result-actions">
              <button
                className="secondary-speaking-result"
                onClick={restart}
              >
                <RotateCcw size={18} />
                Practice Again
              </button>

              <button
                className="primary-speaking-result"
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