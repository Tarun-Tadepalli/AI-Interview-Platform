import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Keyboard,
  Clock3,
  Hash,
  CircleDot,
  RotateCcw,
  Trophy,
  Target,
  Zap,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  LayoutDashboard,
  TimerReset,
} from "lucide-react";
import Navbar1 from "../components/Navbar1";
import "../styles/typingpractice.css";
import { saveTypingResult } from "../services/typingService";

const WORDS = [
  "about", "above", "accept", "across", "action", "active", "actually",
  "after", "again", "against", "almost", "already", "always", "another",
  "answer", "around", "because", "before", "better", "between", "change",
  "different", "during", "early", "enough", "every", "example", "family",
  "first", "follow", "found", "future", "general", "great", "group",
  "important", "include", "inside", "interest", "keep", "large", "later",
  "learn", "level", "little", "local", "machine", "major", "making",
  "matter", "maybe", "means", "message", "modern", "moment", "money",
  "month", "morning", "mother", "natural", "never", "number", "often",
  "office", "order", "other", "people", "place", "point", "possible",
  "power", "practice", "problem", "process", "program", "project",
  "provide", "public", "question", "quick", "reason", "really", "result",
  "right", "second", "several", "should", "simple", "since", "small",
  "something", "sometimes", "special", "start", "state", "still", "story",
  "strong", "student", "system", "technology", "their", "there", "these",
  "thing", "think", "those", "through", "today", "together", "under",
  "understand", "until", "using", "value", "very", "want", "water",
  "while", "without", "work", "world", "would", "write", "young",
  "your", "computer", "software", "developer", "database", "network",
  "application", "interface", "website", "language", "keyboard",
  "screen", "information", "development", "experience", "performance",
  "security", "design", "feature", "testing", "building", "coding",
  "learning", "technical", "creative", "communication", "challenge",
  "solution", "function", "variable", "structure", "algorithm", "server",
  "client", "browser", "internet", "cloud", "engineer", "career",
  "company", "college", "project", "resume", "interview", "practice",
];

const NUMBER_TOKENS = [
  "12", "24", "42", "64", "99", "101", "202", "365", "500", "1000",
  "2024", "2025", "2026", "42", "73", "88", "120", "250", "404", "808",
];

const PUNCTUATION = [",", ".", "!", "?", ";", ":"];

const TIME_OPTIONS = [10, 20, 30, 40, 50, 60];
const WORD_OPTIONS = [10, 25, 50, 100];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createWord(usePunctuation, useNumbers) {
  if (useNumbers && Math.random() < 0.13) {
    return randomItem(NUMBER_TOKENS);
  }

  let word = randomItem(WORDS);

  if (usePunctuation && Math.random() < 0.22) {
    word += randomItem(PUNCTUATION);
  }

  return word;
}

function generateText(amount, mode, punctuation, numbers) {
  const count = mode === "words" ? amount : Math.max(180, amount * 5);

  return Array.from({ length: count }, () =>
    createWord(punctuation, numbers)
  ).join(" ");
}

function calculateStats(typed, target, elapsedSeconds) {
  let correct = 0;
  let errors = 0;

  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correct++;
    else errors++;
  }

  const elapsedMinutes = Math.max(elapsedSeconds / 60, 1 / 60);
  const correctChars = correct;
  const rawWpm = Math.round(
    (typed.length / 5) / elapsedMinutes
  );
  const wpm = Math.round(
    (correctChars / 5) / elapsedMinutes
  );

  const accuracy = typed.length
    ? Math.round((correct / typed.length) * 100)
    : 100;

  return {
    wpm: Math.max(0, wpm),
    rawWpm: Math.max(0, rawWpm),
    accuracy,
    errors,
    correct,
    characters: typed.length,
  };
}

function formatSeconds(seconds) {
  return `${String(Math.max(0, seconds)).padStart(2, "0")}s`;
}

export default function TypingPractice() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("time");
  const [timeLimit, setTimeLimit] = useState(30);
  const [wordLimit, setWordLimit] = useState(25);

  const [punctuation, setPunctuation] = useState(false);
  const [numbers, setNumbers] = useState(false);

  const [screen, setScreen] = useState("setup");

  const [targetText, setTargetText] = useState("");
  const [typedText, setTypedText] = useState("");

  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(30);

  const [stats, setStats] = useState({
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    errors: 0,
    correct: 0,
    characters: 0,
  });

  const [restartArmed, setRestartArmed] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  const typingAreaRef = useRef(null);
  const typingTextRef = useRef(null);
  const currentCharacterRef = useRef(null);
  const typedRef = useRef("");
  const targetRef = useRef("");
  const startedRef = useRef(false);
  const elapsedRef   = useRef(0);
  const startTimeRef = useRef(null);
  const finishedRef = useRef(false);  

  const currentLimit = mode === "time" ? timeLimit : wordLimit;

  const wordsTyped = useMemo(
    () => typedText.trim().split(/\s+/).filter(Boolean).length,
    [typedText]
  );

  const targetWords = useMemo(
    () => targetText.split(" "),
    [targetText]
  );

  useEffect(() => {
    targetRef.current = targetText;
  }, [targetText]);

  useEffect(() => {
    typedRef.current = typedText;
  }, [typedText]);

  useEffect(() => {

    if (screen !== "test" ||!started) {
      return;
    }
  
    const interval = setInterval(() => {
  
      if (!startTimeRef.current) {
        return;
      }
  
      const actualElapsed = Math.floor(
        (
          performance.now() -
          startTimeRef.current
        ) / 1000
      );
  
      elapsedRef.current =
        actualElapsed;
  
      setElapsed(actualElapsed);
  
      const liveStats =
        calculateStats(
          typedRef.current,
          targetRef.current,
          Math.max(actualElapsed, 1)
        );
  
      setStats(liveStats);
  
      if (
        mode === "time" &&
        actualElapsed >= timeLimit
      ) {
  
        setRemaining(0);
  
        finishTest();
        return;
      }
  
      if (mode === "time") {
  
        setRemaining(
          Math.max(
            timeLimit - actualElapsed,
            0
          )
        );
      }
  
    }, 100);
  
    return () => {
      clearInterval(interval);
    };
  
  }, [
    screen,
    started,
    mode,
    timeLimit,
  ]);

  useEffect(() => {
    if (screen === "test") {
      setTimeout(() => typingAreaRef.current?.focus(), 50);
    }
  }, [screen]);

  useEffect(() => {
    if (screen !== "test" || !currentCharacterRef.current || !typingTextRef.current) {
      return;
    }
  
    const wrapper = typingTextRef.current;
    const currentCharacter = currentCharacterRef.current;
  
    const currentTop = currentCharacter.offsetTop;
    const currentBottom =
      currentTop + currentCharacter.offsetHeight;
  
    const visibleTop = wrapper.scrollTop;
    const visibleBottom =
      visibleTop + wrapper.clientHeight;
  
    if (currentTop < visibleTop || currentBottom > visibleBottom) {
      const targetScrollTop =
        currentTop -
        wrapper.clientHeight / 2 +
        currentCharacter.offsetHeight / 2;
  
      wrapper.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth",
      });
    }
  }, [typedText, screen]);

  useEffect(() => {
    if (screen !== "test") return;

    const handleVisibility = () => {
      if (document.hidden) {
        // The browser cannot be completely locked,
        // but the test remains active.
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () =>
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
  }, [screen]);

  const startTest = () => {
    const generated = generateText(
      currentLimit,
      mode,
      punctuation,
      numbers
    );

    setTargetText(generated);
    targetRef.current = generated;

    setTypedText("");
    typedRef.current = "";

    setElapsed(0);
    elapsedRef.current = 0;
    startTimeRef.current = null;

    setRemaining(mode === "time" ? timeLimit : 0);

    setStarted(false);
    startedRef.current = false;

    setRestartArmed(false);
    setSaveStatus("idle");
    finishedRef.current = false;

    setStats({
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      errors: 0,
      correct: 0,
      characters: 0,
    });

    setScreen("test");
  };

  const startClockIfNeeded = () => {

    if (!startedRef.current) {
  
      startTimeRef.current = performance.now();
  
      startedRef.current = true;
  
      setStarted(true);
    }
  };

  const handleKeyDown = (event) => {
    if (screen !== "test") return;

    if (event.key === "Tab") {
      event.preventDefault();
      setRestartArmed(true);
      return;
    }

    if (restartArmed && event.key === "Enter") {
      event.preventDefault();
      restartTest();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      restartTest();
      return;
    }

    if (event.ctrlKey || event.altKey || event.metaKey) return;

    if (event.key === "Backspace") {
      event.preventDefault();

      if (!typedRef.current.length) return;

      const next = typedRef.current.slice(0, -1);

      typedRef.current = next;
      setTypedText(next);

      setStats(
        calculateStats(
          next,
          targetRef.current,
          Math.max(elapsedRef.current, 1)
        )
      );

      return;
    }

    if (event.key === " ") {
      event.preventDefault();
      startClockIfNeeded();

      if (
        typedRef.current.length >= targetRef.current.length
      ) {
        return;
      }

      const next = `${typedRef.current} `;

      typedRef.current = next;
      setTypedText(next);

      checkCompletion(next);
      return;
    }

    if (event.key.length !== 1) return;

    event.preventDefault();

    startClockIfNeeded();

    if (typedRef.current.length >= targetRef.current.length) {
      return;
    }

    const next = typedRef.current + event.key;

    typedRef.current = next;
    setTypedText(next);

    const liveStats = calculateStats(
      next,
      targetRef.current,
      Math.max(elapsedRef.current, 1)
    );

    setStats(liveStats);

    checkCompletion(next);
  };

  const checkCompletion = (value) => {
    if (mode !== "words") return;
  
    const completedWords = value
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  
    if (completedWords >= wordLimit) {
      finishTest();
    }
  };

  const finishTest = async () => {
    if (
      screen !== "test" ||
      finishedRef.current
    ) {
      return;
    }
  
    finishedRef.current = true;
  
    const finalElapsed = Math.max(
      elapsedRef.current,
      1
    );
  
    const localStats = calculateStats(
      typedRef.current,
      targetRef.current,
      finalElapsed
    );
  
    // Show the final result immediately.
    setStats(localStats);
    setStarted(false);
    startedRef.current = false;
    setSaveStatus("saving");
    setScreen("results");
  
    const resultData = {
      mode,
      time_limit:
        mode === "time"
          ? timeLimit
          : null,
      word_limit:
        mode === "words"
          ? wordLimit
          : null,
      punctuation,
      numbers,
      typed_text: typedRef.current,
      target_text: targetRef.current,
      elapsed_seconds: finalElapsed,
    };
  
    try {
      const response = await saveTypingResult(
        resultData
      );
  
      const backendResult =
        response?.result ??
        response?.data?.result ??
        response;
  
      const backendStats =
        backendResult?.stats;
  
      if (backendStats) {
        const finalStats = {
          wpm:
            backendStats.wpm ??
            localStats.wpm,
  
          rawWpm:
            backendStats.rawWpm ??
            backendStats.raw_wpm ??
            localStats.rawWpm,
  
          accuracy:
            backendStats.accuracy ??
            localStats.accuracy,
  
          errors:
            backendStats.errors ??
            localStats.errors,
  
          correct:
            backendStats.correct ??
            backendStats.correct_characters ??
            localStats.correct,
  
          characters:
            backendStats.characters ??
            localStats.characters,
        };
  
        setStats(finalStats);
  
        localStorage.setItem(
          "aiTypingPracticeResult",
          JSON.stringify({
            ...resultData,
            completedAt:
              new Date().toISOString(),
            stats: finalStats,
            backendResult,
          })
        );
      } else {
        localStorage.setItem(
          "aiTypingPracticeResult",
          JSON.stringify({
            ...resultData,
            completedAt:
              new Date().toISOString(),
            stats: localStats,
          })
        );
      }
  
      setSaveStatus("saved");
  
    } catch (error) {
      console.error(
        "Failed to save typing result:",
        error
      );
  
      // The result is already visible.
      // Keep the locally calculated result.
      localStorage.setItem(
        "aiTypingPracticeResult",
        JSON.stringify({
          ...resultData,
          completedAt:
            new Date().toISOString(),
          stats: localStats,
          saveFailed: true,
        })
      );
  
      setStats(localStats);
      setSaveStatus("error");
    }
  };

  

  const restartTest = () => {
    setScreen("setup");
    setStarted(false);
    startedRef.current = false;
    startTimeRef.current = null;
    finishedRef.current = false;
    setRestartArmed(false);
  };

  const startAgainImmediately = () => {
    startTest();
  };

  const renderText = () => {
    const typed = typedText;

    return targetText.split("").map((character, index) => {
      let className = "typing-character";

      if (index < typed.length) {
        className +=
          typed[index] === character
            ? " correct"
            : " incorrect";
      } else if (index === typed.length) {
        className += " current";
      }

      return (
      <span 
      className={className}
      key={`${character}-${index}`}
      ref={index === typed.length ? currentCharacterRef : null}
      >
      {character === " " ? "\u00A0" : character}
      </span>
    );
    });
  };

  if (screen === "setup") {
    return (
      <Navbar1>
        <main className="app-content typing-content">
          <section className="typing-page">
            <div className="typing-heading">
              <div>
                <span className="section-kicker">
                  TYPING PRACTICE
                </span>

                <h1>Build Speed. Improve Accuracy.</h1>

                <p>
                  Practice with randomly generated typing tests and measure
                  your speed, accuracy, consistency and mistakes.
                </p>
              </div>
            </div>

            <div className="typing-workspace">
              <div className="typing-config-card">
                <div className="typing-config-header">
                  <div className="typing-config-icon">
                    <Keyboard size={22} />
                  </div>

                  <div>
                    <h2>Practice Configuration</h2>
                    <p>
                      Choose your test type and customize the text.
                    </p>
                  </div>
                </div>

                <div className="typing-mode-tabs">
                  <button
                    className={mode === "time" ? "active" : ""}
                    onClick={() => setMode("time")}
                  >
                    <Clock3 size={17} />
                    Time
                  </button>

                  <button
                    className={mode === "words" ? "active" : ""}
                    onClick={() => setMode("words")}
                  >
                    <Keyboard size={17} />
                    Words
                  </button>
                </div>

                <div className="typing-option-section">
                  <span className="typing-option-label">
                    {mode === "time"
                      ? "Choose Duration"
                      : "Choose Word Count"}
                  </span>

                  <div className="choice-row">
                    {(mode === "time"
                      ? TIME_OPTIONS
                      : WORD_OPTIONS
                    ).map((option) => {
                      const selected =
                        mode === "time"
                          ? timeLimit === option
                          : wordLimit === option;

                      return (
                        <button
                          key={option}
                          className={
                            selected ? "choice active" : "choice"
                          }
                          onClick={() => {
                            if (mode === "time") {
                              setTimeLimit(option);
                            } else {
                              setWordLimit(option);
                            }
                          }}
                        >
                          {option}
                          {mode === "time" && "s"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="typing-option-section">
                  <span className="typing-option-label">
                    Text Options
                  </span>

                  <div className="feature-toggle-grid">
                    <button
                      className={
                        punctuation
                          ? "feature-toggle active"
                          : "feature-toggle"
                      }
                      onClick={() =>
                        setPunctuation((previous) => !previous)
                      }
                    >
                      <CircleDot size={18} />
                      <span>
                        <strong>Punctuation</strong>
                        <small>Commas, periods & symbols</small>
                      </span>

                      <i />
                    </button>

                    <button
                      className={
                        numbers
                          ? "feature-toggle active"
                          : "feature-toggle"
                      }
                      onClick={() =>
                        setNumbers((previous) => !previous)
                      }
                    >
                      <Hash size={18} />

                      <span>
                        <strong>Numbers</strong>
                        <small>Include numerical values</small>
                      </span>

                      <i />
                    </button>
                  </div>
                </div>

                <button
                  className="start-typing-button"
                  onClick={startTest}
                >
                  <Keyboard size={19} />
                  Start Typing Test
                </button>
              </div>

              <div className="typing-info-card">
                <div className="typing-preview">
                  <div className="preview-speed">
                    <strong>WPM</strong>
                    <span>--</span>
                  </div>

                  <div className="preview-divider" />

                  <div className="preview-speed">
                    <strong>ACC</strong>
                    <span>--</span>
                  </div>

                  <div className="preview-keyboard">
                    <Keyboard size={31} />
                  </div>
                </div>

                <h2>Random Typing Challenges</h2>

                <p>
                  Every test creates a fresh sequence of words. Punctuation
                  and numbers can be enabled independently to make practice
                  more challenging.
                </p>

                <div className="typing-benefits">
                  <div>
                    <Zap size={18} />
                    <span>Real-time WPM</span>
                  </div>

                  <div>
                    <Target size={18} />
                    <span>Character-level accuracy</span>
                  </div>

                  <div>
                    <BarChart3 size={18} />
                    <span>Raw speed and error tracking</span>
                  </div>

                  <div>
                    <Trophy size={18} />
                    <span>Results ready for Progress</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </Navbar1>
    );
  }

  if (screen === "test") {
    const liveStats = calculateStats(
      typedText,
      targetText,
      Math.max(elapsed, 1)
    );

    return (
      <main
        className="typing-test-screen"
        tabIndex={0}
        ref={typingAreaRef}
        onKeyDown={handleKeyDown}
        onClick={() => typingAreaRef.current?.focus()}
      >
        <div className="typing-test-topbar">
          <div className="typing-test-brand">
            <div className="typing-brand-icon">
              <Keyboard size={18} />
            </div>

            <span>AI Interview Platform</span>
          </div>

          <div className="typing-test-meta">
            <span>
              {mode === "time"
                ? `${timeLimit} second test`
                : `${wordLimit} word test`}
            </span>

            {punctuation && (
              <span className="meta-tag">Punctuation</span>
            )}

            {numbers && (
              <span className="meta-tag">Numbers</span>
            )}
          </div>
        </div>

        <div className="typing-live-stats">
          <div>
            <span>WPM</span>
            <strong>{liveStats.wpm || 0}</strong>
          </div>

          <div>
            <span>ACC</span>
            <strong>{liveStats.accuracy}%</strong>
          </div>

          <div>
            <span>RAW</span>
            <strong>{liveStats.rawWpm || 0}</strong>
          </div>

          <div>
            <span>ERRORS</span>
            <strong>{liveStats.errors}</strong>
          </div>

          <div className="typing-countdown">
            <Clock3 size={16} />
            <strong>
              {mode === "time"
                ? formatSeconds(remaining)
                : `${wordsTyped}/${wordLimit}`}
            </strong>
          </div>
        </div>

        <section className="typing-test-main">
          <div className="typing-language">
            <Keyboard size={15} />
            English
          </div>

          <div className="typing-text-wrapper" ref={typingTextRef}>
            <div className="typing-text">{renderText()}</div>
          </div>

          <div className="typing-hint">
            Click here or press any key to start typing
          </div>

          <div className="typing-shortcuts">
            <span>
              <kbd>Tab</kbd> + <kbd>Enter</kbd> restart
            </span>

            <span>
              <kbd>Esc</kbd> restart
            </span>

            <span>
              {punctuation ? "Punctuation on" : "Punctuation off"}
            </span>

            <span>
              {numbers ? "Numbers on" : "Numbers off"}
            </span>
          </div>
        </section>

        <div className="typing-test-footer">
          <span>
            {restartArmed
              ? "Press Enter to restart"
              : "Type naturally — accuracy matters"}
          </span>

          <button onClick={restartTest}>
            <RotateCcw size={14} />
            Exit Test
          </button>
        </div>
      </main>
    );
  }

  if (screen === "results") {
    return (
      <Navbar1>
        <main className="app-content typing-content">
          <section className="typing-results-page">
            <div className="typing-result-icon">
              <Trophy size={37} />
            </div>

            <span className="section-kicker">
              TEST COMPLETED
            </span>

            <h1>Your Typing Result</h1>

            <p className="typing-results-description">
              {saveStatus === "saving" && (
                "Calculating and securely saving your typing result..."
              )}
              
              {saveStatus === "saved" && (
                "Your typing result has been saved successfully and is ready for your Progress history."
              )}

              {saveStatus === "error" && (
                "Your result was calculated successfully, but it could not be saved to the server. A local backup was kept."
              )}
            </p>

            <div className="typing-result-hero">
              <div>
                <span>Words Per Minute</span>
                <strong>{stats.wpm}</strong>
              </div>

              <div>
                <span>Accuracy</span>
                <strong>{stats.accuracy}%</strong>
              </div>

              <div>
                <span>Raw WPM</span>
                <strong>{stats.rawWpm}</strong>
              </div>
            </div>

            <div className="typing-result-grid">
              <div>
                <span>Characters</span>
                <strong>{stats.characters}</strong>
              </div>

              <div>
                <span>Correct Characters</span>
                <strong>{stats.correct}</strong>
              </div>

              <div>
                <span>Errors</span>
                <strong>{stats.errors}</strong>
              </div>

              <div>
                <span>Test Type</span>
                <strong>
                  {mode === "time"
                    ? `${timeLimit}s`
                    : `${wordLimit} words`}
                </strong>
              </div>
            </div>

            <div className="typing-analysis-card">
              <div className="typing-analysis-icon">
                <BarChart3 size={21} />
              </div>

              <div>
                <h2>Performance Analysis</h2>

                <p>
                  Your current result measures typing speed and accuracy.
                  Later, the Progress module will compare your attempts,
                  identify trends and show your improvement over time.
                </p>
              </div>
            </div>

            <div className="typing-result-settings">
              <span>
                {punctuation ? "Punctuation enabled" : "Punctuation disabled"}
              </span>

              <span>
                {numbers ? "Numbers enabled" : "Numbers disabled"}
              </span>
            </div>

            <div className="typing-result-actions">
              <button
                className="secondary-typing-result"
                onClick={startAgainImmediately}
              >
                <TimerReset size={18} />
                Try Again
              </button>

              <button
                className="primary-typing-result"
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