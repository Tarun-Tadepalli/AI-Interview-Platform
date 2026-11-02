import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  SkipForward,
  CheckCircle2,
  AlertCircle,
  Maximize,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  LayoutDashboard,
  FileText,
  Printer,
  Square,
  Code2,
} from "lucide-react";
import Navbar1 from "../components/Navbar1";
import "../styles/interview.css";

const focusLabels = {
  mixed: "Mixed",
  programming: "Programming",
  dsa: "Data Structures & Algorithms",
  web: "Web Development",
  database: "Database",
  ai: "AI / ML",
  system: "System Design",
};

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

// Detect questions that explicitly ask the candidate to write code or a query.
// This is intentionally a small frontend-only helper; question generation is unchanged.
function isCodeWritingPrompt(question = "") {
  const text = String(question).toLowerCase();
  return /\b(write|implement|code|create|build|complete|debug|fix)\b.{0,90}\b(code|program|function|method|class|query|sql|algorithm|script)\b/.test(text)
    || /\b(write|implement|produce)\b.{0,50}\b(sql query|query|code snippet|code solution)\b/.test(text)
    || /\b(what query would you write|write a query|write an sql query|write a program|write a function|write code)\b/.test(text);
}

function guessCodeLanguage(question = "") {
  const text = String(question).toLowerCase();
  if (/\bsql|database query|select statement\b/.test(text)) return "SQL";
  if (/\bpython\b/.test(text)) return "Python";
  if (/\bjava\b/.test(text)) return "Java";
  if (/\bc\+\+\b/.test(text)) return "C++";
  if (/\bjavascript|react\b/.test(text)) return "JavaScript";
  return "Plain Text";
}

function getAuthToken() {
  const keys = ["access_token", "token", "authToken"];
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return null;
}

async function interviewApi(path, options = {}) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Please log in again before starting the interview.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : data.detail?.message || `Request failed (${response.status})`;
    throw new Error(detail);
  }

  return data;
}

export default function Interview() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("setup");

  const [setup, setSetup] = useState({
    type: "resume",
    difficulty: "medium",
    focus: "mixed",
  });

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [codePadOpen, setCodePadOpen] = useState(false);
  const [codePadDraft, setCodePadDraft] = useState("");
  const [submittedCode, setSubmittedCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("Plain Text");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isIntroSpeaking, setIsIntroSpeaking] = useState(false);
  const [interviewClockStarted, setInterviewClockStarted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micError, setMicError] = useState("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [skippedRound, setSkippedRound] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60);
  const [questionTimerPaused, setQuestionTimerPaused] = useState(false);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [previousScorecard, setPreviousScorecard] = useState(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [emptyAnswerWarning, setEmptyAnswerWarning] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewError, setInterviewError] = useState("");
  const [finalResult, setFinalResult] = useState(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [securityWarning, setSecurityWarning] = useState(false);
  const [securitySeconds, setSecuritySeconds] = useState(5);
  const finishStartedRef = useRef(false);
  const welcomeSpokenRef = useRef(false);
  const clockStartRequestedRef = useRef(false);

  const recognitionRef = useRef(null);
  const answerRef = useRef("");
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const silenceIntervalRef = useRef(null);
  const noSpeechTimerRef = useRef(null);
  const speechStartedRef = useRef(false);
  const lastVoiceAtRef = useRef(0);
  const finalizingAudioRef = useRef(false);
  const audioChunksRef = useRef([]);
  const autoSubmitAfterTranscriptionRef = useRef(false);
  const submitLockRef = useRef(false);
  const questionHandledRef = useRef(false);
  const tabSwitchesRef = useRef(0);
  const lastSecurityEventAtRef = useRef(0);
  const wasFullscreenRef = useRef(false);
  const autoOpenedCodeQuestionRef = useRef(null);

  const currentQuestion = questions[currentIndex];

  // Open the coding pad once when a coding question first appears. The candidate
  // can close it and reopen it with the button without it popping up repeatedly.
  useEffect(() => {
    if (mode !== "interview" || !currentQuestion?.id) return;
    if (autoOpenedCodeQuestionRef.current === currentQuestion.id) return;
    autoOpenedCodeQuestionRef.current = currentQuestion.id;

    const codingQuestion = isCodeWritingPrompt(currentQuestion.question);
    setCodePadOpen(codingQuestion);
    setCodePadDraft("");
    setSubmittedCode("");
    setCodeLanguage(guessCodeLanguage(currentQuestion.question));
  }, [mode, currentQuestion?.id]);

  useEffect(() => {
    let cancelled = false;
    const loadSetupData = async () => {
      try {
        const [resumeResponse, availability, history] = await Promise.all([
          interviewApi("/resume/me"),
          interviewApi("/interview/availability"),
          interviewApi("/interview/history/list"),
        ]);
        if (cancelled) return;
        setResumeInfo(resumeResponse?.resume || null);
        setCooldownSeconds(Number(availability?.cooldown_seconds || 0));
        const last = (history?.sessions || []).find((item) => item.status === "completed" && item.overall_score !== null && item.overall_score !== undefined);
        if (last) {
          const report = await interviewApi(`/interview/${last.id}/report`);
          if (!cancelled) setPreviousScorecard(report);
        }
      } catch (error) {
        if (!cancelled) setInterviewError(error.message || "Could not load resume and previous scorecard details.");
      }
    };
    if (mode === "setup") void loadSetupData();
    return () => { cancelled = true; };
  }, [mode]);

  useEffect(() => {
    if (mode !== "setup" || cooldownSeconds <= 0) return undefined;
    const timer = window.setInterval(() => setCooldownSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [mode, cooldownSeconds > 0]);

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
    if (mode !== "interview" || !sessionId || !interviewClockStarted) return undefined;
    const timerId = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timerId);
  }, [mode, sessionId, interviewClockStarted]);

  useEffect(() => {
    if (mode !== "interview" || !sessionId || !currentQuestion || isSpeaking || questionTimerPaused || isSubmitting) return undefined;
    const startedAt = Date.now() - (60 - questionTimeLeft) * 1000;
    const timer = window.setInterval(() => {
      // Freeze the displayed timer immediately when submit/skip starts. Network and
      // AI processing time must never consume the candidate's answer time.
      if (questionTimerPaused || questionHandledRef.current || isSubmitting) return;
      const left = Math.max(0, 60 - Math.floor((Date.now() - startedAt) / 1000));
      setQuestionTimeLeft(left);
      if (left <= 0 && !questionHandledRef.current) {
        window.clearInterval(timer);
        void submitCurrentAnswer(true);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [mode, sessionId, currentIndex, currentQuestion?.id, isSpeaking, questionTimerPaused, isSubmitting]);

  useEffect(() => {
    if (mode !== "interview" || !sessionId) return undefined;

    // Count tab/window changes and exiting browser fullscreen as the same security event.
    // Browsers can fire both events for one action, so debounce the pair.
    const recordSecurityViolation = async () => {
      const now = Date.now();
      if (now - lastSecurityEventAtRef.current < 900 || finishStartedRef.current) return;
      lastSecurityEventAtRef.current = now;
      const count = tabSwitchesRef.current + 1;
      tabSwitchesRef.current = count;
      setTabSwitches(count);

      if (count >= 3) {
        setSecurityWarning(false);
        setInterviewError("Three tab/full-screen violations detected. Ending the interview.");
        await finishInterview(questions);
        return;
      }

      setSecurityWarning(true);
      setSecuritySeconds(0);
      try {
        const result = await interviewApi(`/interview/${sessionId}/tab-switch`, {
          method: "POST", body: JSON.stringify({ count }),
        });
        setInterviewError(result.message || `Tab/window switch ${count} of 3 detected.`);
        if (result.terminate) {
          setSecurityWarning(false);
          await finishInterview(questions);
        }
      } catch (error) {
        setInterviewError(error.message || "Could not record the tab/window switch.");
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") void recordSecurityViolation();
    };
    const onFullscreenChange = () => {
      const fullscreenNow = Boolean(document.fullscreenElement);
      if (fullscreenNow) {
        wasFullscreenRef.current = true;
      } else if (wasFullscreenRef.current && !finishStartedRef.current) {
        wasFullscreenRef.current = false;
        void recordSecurityViolation();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [mode, sessionId, questions]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      stopListening();
    };
  }, []);

  useEffect(() => {
    if (!currentQuestion || mode !== "interview") return;

    questionHandledRef.current = false;
    setQuestionTimerPaused(false);
    setQuestionTimeLeft(60);
    setIsSpeaking(true);
    setIsIntroSpeaking(!welcomeSpokenRef.current);
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
    if (!("speechSynthesis" in window)) {
      setIsSpeaking(false);
      setIsIntroSpeaking(false);
      setMicError("Text-to-speech is unavailable in this browser. You can still read the question and answer.");
      if (!welcomeSpokenRef.current && sessionId && !clockStartRequestedRef.current) {
        welcomeSpokenRef.current = true;
        clockStartRequestedRef.current = true;
        void interviewApi(`/interview/${sessionId}/begin`, { method: "POST", body: JSON.stringify({}) })
          .then((started) => { setTimeLeft(Number(started.duration_seconds || 600)); setInterviewClockStarted(true); })
          .catch((error) => { setInterviewError(error.message || "Could not synchronize the interview timer."); setInterviewClockStarted(true); })
          .finally(() => { void startListening(); });
      } else {
        void startListening();
      }
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((voice) => /en-IN/i.test(voice.lang)) ||
      voices.find((voice) => /en-US/i.test(voice.lang)) ||
      voices.find((voice) => /^en/i.test(voice.lang));

    const speak = (text, onEnd) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.94;
      utterance.pitch = 1;
      utterance.volume = 1;
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.onend = onEnd;
      utterance.onerror = () => { setIsSpeaking(false); if (onEnd) onEnd(); };
      window.speechSynthesis.speak(utterance);
    };

    if (!welcomeSpokenRef.current) {
      welcomeSpokenRef.current = true;
      setIsIntroSpeaking(true);
      speak(
        "Hi, I'm Nova, your AI interviewer. Welcome to your interview. Please answer clearly and professionally. You may ask to repeat a question, skip a question, or end the interview at any time. Let's begin.",
        async () => {
          setIsIntroSpeaking(false);
          // Start the authoritative server clock only after the full introduction ends.
          if (sessionId && !clockStartRequestedRef.current) {
            clockStartRequestedRef.current = true;
            try {
              const started = await interviewApi(`/interview/${sessionId}/begin`, { method: "POST", body: JSON.stringify({}) });
              setTimeLeft(Number(started.duration_seconds || 600));
              setInterviewClockStarted(true);
            } catch (error) {
              // Keep the interview usable if the clock-start request has a transient failure.
              setInterviewError(error.message || "Could not synchronize the interview timer.");
              setInterviewClockStarted(true);
            }
          }
          speak(question, () => {
            setIsSpeaking(false);
            startListening();
          });
        }
      );
      return;
    }

    setIsIntroSpeaking(false);
    speak(question, () => {
      setIsSpeaking(false);
      startListening();
    });
  };

  const stopQuestionReading = () => {
    if (isIntroSpeaking || !isSpeaking || isSubmitting) return;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setInterviewError("");
    // The question timer starts as soon as reading is stopped, and recording begins.
    void startListening();
  };

  const startListening = async () => {
    if (isListening || finalizingAudioRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      mediaStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      speechStartedRef.current = false;
      finalizingAudioRef.current = false;
      lastVoiceAtRef.current = Date.now();
      recorder.ondataavailable = (event) => { if (event.data?.size) audioChunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        if (finishStartedRef.current || finalizingAudioRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
          return;
        }
        finalizingAudioRef.current = true;
        clearInterval(silenceIntervalRef.current);
        clearTimeout(noSpeechTimerRef.current);
        try {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
          stream.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
          if (!speechStartedRef.current || blob.size < 1000) {
            setIsListening(false);
            // Never silently skip a question just because no usable audio was captured.
            // Keep the same question active so the candidate can try again.
            autoSubmitAfterTranscriptionRef.current = false;
            questionHandledRef.current = false;
            setQuestionTimerPaused(false);
            setQuestionTimeLeft(60);
            setMicError("I couldn't capture a clear spoken answer. This question has not been submitted or skipped. Click Hear Again and try once more.");
            setInterviewError("No usable audio was captured. Your answer was not submitted; please record it again.");
            return;
          }
          setIsListening(false);
          setIsSubmitting(true);
          const token = getAuthToken();
          const form = new FormData();
          form.append("audio", blob, "answer.webm");
          const response = await fetch(`${API_BASE}/interview/${sessionId}/transcribe`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.detail || `Deepgram request failed (${response.status})`);
          const transcript = (data.transcript || "").trim();
          answerRef.current = transcript;
          setAnswerText(transcript);
          setIsSubmitting(false);
          if (autoSubmitAfterTranscriptionRef.current) {
            autoSubmitAfterTranscriptionRef.current = false;
            if (transcript.trim()) {
              await sendAnswerText(transcript);
            } else {
              questionHandledRef.current = false;
              await skipQuestion();
            }
          } else if (!transcript) {
            setMicError("No speech was detected. Click Hear Again and try once more.");
          }
        } catch (error) {
          setIsSubmitting(false);
          // A transcription/API failure is not an unanswered response. Keep the
          // current question active and allow a fresh recording instead of skipping.
          autoSubmitAfterTranscriptionRef.current = false;
          questionHandledRef.current = false;
          setQuestionTimerPaused(false);
          setQuestionTimeLeft(60);
          setMicError("Transcription failed, so your answer was not submitted. Please record it again and retry.");
          setInterviewError("Your answer could not be transcribed and has not been submitted. Please record your answer again.");
        } finally {
          finalizingAudioRef.current = false;
          if (audioContextRef.current) { try { await audioContextRef.current.close(); } catch {} audioContextRef.current = null; }

          // Cover the narrow race where the 60-second timer fires just after the
          // transcript was read but just before this callback finishes.
          if (autoSubmitAfterTranscriptionRef.current && !finishStartedRef.current) {
            autoSubmitAfterTranscriptionRef.current = false;
            const completedTranscript = (answerRef.current || "").trim();
            if (completedTranscript) {
              await sendAnswerText(completedTranscript);
            } else {
              questionHandledRef.current = false;
              await skipQuestion();
            }
          }
        }
      };
      recorder.start(250);
      setIsListening(true);
      setMicError("");
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const context = new AudioContextClass();
        audioContextRef.current = context;
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        silenceIntervalRef.current = setInterval(() => {
          analyser.getByteTimeDomainData(data);
          let sum = 0; for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
          const rms = Math.sqrt(sum / data.length);
          // Detect whether speech occurred, but do not stop on a pause. The candidate
          // may pause to think; recording ends only on manual submit or the 60-second limit.
          if (rms > 0.035) { speechStartedRef.current = true; lastVoiceAtRef.current = Date.now(); }
        }, 250);
      }
      // No-speech cases are handled by the 60-second question timer, which marks
      // the question unanswered only if no usable audio/transcript was captured.
    } catch (error) {
      setIsListening(false);
      setMicError(error.name === "NotAllowedError" ? "Please allow microphone access to start the interview." : "Could not access your microphone. Use Chrome or Edge and allow microphone access.");
    }
  };

  const stopListening = () => {
    clearInterval(silenceIntervalRef.current);
    clearTimeout(noSpeechTimerRef.current);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      // Let MediaRecorder emit its final dataavailable/onstop events before
      // releasing the microphone stream; stopping tracks first can truncate audio.
      try { recorder.stop(); } catch {}
    } else if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsListening(false);
  };

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      wasFullscreenRef.current = Boolean(document.fullscreenElement);
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

  
  const viewResume = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/resume/view`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Could not open your saved resume.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) { setInterviewError(error.message || "Could not open your saved resume."); }
  };

  const viewPreviousScorecard = () => {
    if (!previousScorecard) return;
    setFinalResult(previousScorecard);
    setMode("results");
  };

  const startInterview = async () => {
    setInterviewError("Preparing your resume-based interview...");
    setIsSubmitting(true);
    finishStartedRef.current = false;
    welcomeSpokenRef.current = false;
    clockStartRequestedRef.current = false;
    setInterviewClockStarted(false);
    setIsIntroSpeaking(false);
    try {
      const result = await interviewApi("/interview/start", {
        method: "POST",
        body: JSON.stringify({ interview_type: "resume", difficulty: setup.difficulty, focus: "mixed" }),
      });
      const q = result.question;
      if (!result.session_id || !q?.id || !q?.question_text) {
        throw new Error("The server did not return a valid session and first question.");
      }
      setInterviewError("");
      setSessionId(result.session_id);
      localStorage.setItem("aiInterviewActiveSessionId", String(result.session_id));
      setQuestions([{
        id: q.id, number: q.question_number || 1, question: q.question_text,
        questionType: q.question_type || setup.type, answer: "", answered: false, skipped: false,
      }]);
      setCurrentIndex(0);
      setAnswerText("");
      answerRef.current = "";
      setCodePadOpen(false);
      setCodePadDraft("");
      setSubmittedCode("");
      autoOpenedCodeQuestionRef.current = null;
      setSkippedRound(false);
      setCompletedCount(0);
      setTabSwitches(0);
      tabSwitchesRef.current = 0;
      lastSecurityEventAtRef.current = 0;
      wasFullscreenRef.current = false;
      setSecurityWarning(false);
      setFinalResult(null);
      setTimeLeft(result.duration_seconds || 600);
      setInterviewClockStarted(false);
      setIsIntroSpeaking(false);
      setQuestionTimeLeft(60);
      setInterviewStarted(true);
      setMode("interview");
      localStorage.setItem("aiInterviewSetup", JSON.stringify({ ...setup, sessionId: result.session_id, startedAt: result.started_at }));
      await enterFullscreen();
    } catch (error) {
      setInterviewError(error.message || "Unable to start the interview.");
    } finally {
      setIsSubmitting(false);
    }
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

    const sendAnswerText = async (providedAnswer = answerRef.current) => {
    if (!sessionId || !currentQuestion || finishStartedRef.current || submitLockRef.current) return;
    const spokenAnswer = (providedAnswer || "").trim();
    const codeBlock = submittedCode.trim()
      ? `[Code submission - Language: ${codeLanguage}]\\n${submittedCode.trim()}`
      : "";
    const answer = [spokenAnswer, codeBlock].filter(Boolean).join("\\n\\n").trim();
    if (!answer) { setEmptyAnswerWarning("You haven't answered this question yet. Submit it as unanswered and continue?"); return; }
    submitLockRef.current = true;
    questionHandledRef.current = true;
    setQuestionTimerPaused(true);
    setEmptyAnswerWarning("");
    stopListening(); window.speechSynthesis?.cancel(); setIsSubmitting(true); setInterviewError("AI is evaluating your answer and preparing the next question. Please wait...");
    try {
      const response = await interviewApi(`/interview/${sessionId}/answer`, {
        method: "POST", body: JSON.stringify({ question_id: currentQuestion.id, answer_text: answer, answer_status: "answered" }),
      });
      setInterviewError("");
      const updated = questions.map((q, i) => i === currentIndex ? { ...q, answer, answered: true, skipped: false, evaluation: response.evaluation } : q);
      setCompletedCount(updated.filter((q) => q.answered).length);
      const next = response.next_question;
      if (!next?.id || !next?.question_text) { setQuestions(updated); await finishInterview(updated); return; }
      setQuestions([...updated, { id: next.id, number: next.question_number, question: next.question_text, questionType: next.question_type, answer: "", answered: false, skipped: false }]);
      setCurrentIndex(updated.length); setAnswerText(""); answerRef.current = ""; setCodePadOpen(false); setCodePadDraft(""); setSubmittedCode("");
      if (typeof response.remaining_seconds === "number") setTimeLeft(response.remaining_seconds);
    } catch (error) {
      questionHandledRef.current = false;
      setQuestionTimerPaused(false);
      setInterviewError(error.message || "Could not save your answer.");
    }
    finally { setIsSubmitting(false); submitLockRef.current = false; }
  };

  const submitCurrentAnswer = async (automatic = false) => {
    if (finishStartedRef.current || submitLockRef.current || !currentQuestion) return;

    // The timer callback can hold an older React state snapshot. Check the recorder
    // itself instead of relying on the potentially stale `isListening` state.
    if (finalizingAudioRef.current) {
      setQuestionTimerPaused(true);
      if (automatic) autoSubmitAfterTranscriptionRef.current = true;
      setInterviewError(automatic ? "Time is up. Finishing transcription and submitting your answer..." : "Finishing transcription before submission...");
      return;
    }

    if (mediaRecorderRef.current?.state === "recording") {
      questionHandledRef.current = true;
      setQuestionTimerPaused(true);
      autoSubmitAfterTranscriptionRef.current = true;
      setInterviewError(automatic ? "Time is up. Transcribing and submitting your answer..." : "Transcribing your answer before submission...");
      stopListening();
      return;
    }

    if (isSubmitting) return;

    const answer = (answerRef.current || answerText || "").trim();
    if (!answer && !submittedCode.trim()) {
      if (automatic) {
        questionHandledRef.current = true;
        setInterviewError("Time is up. No answer was captured; moving to the next question.");
        await skipQuestion();
        return;
      }
      setQuestionTimerPaused(true);
      setEmptyAnswerWarning("No answer was captured for this question. You can keep answering or skip this question.");
      return;
    }
    await sendAnswerText(answer);
  };

  const skipQuestion = async () => {
    if (isSubmitting || !sessionId || !currentQuestion || submitLockRef.current) return;
    questionHandledRef.current = true;
    setQuestionTimerPaused(true);
    stopListening(); window.speechSynthesis?.cancel(); setIsSubmitting(true); setInterviewError("Moving to the next question..."); setEmptyAnswerWarning("");
    try {
      const response = await interviewApi(`/interview/${sessionId}/answer`, {
        method: "POST", body: JSON.stringify({ question_id: currentQuestion.id, answer_text: "", answer_status: "skipped" }),
      });
      setInterviewError("");
      const updated = questions.map((q, i) => i === currentIndex ? { ...q, skipped: true, answered: false, answer: "" } : q);
      const next = response.next_question;
      if (!next?.id || !next?.question_text) { setQuestions(updated); await finishInterview(updated); return; }
      setQuestions([...updated, { id: next.id, number: next.question_number, question: next.question_text, questionType: next.question_type, answer: "", answered: false, skipped: false }]);
      setCurrentIndex(updated.length); setAnswerText(""); answerRef.current = "";
      if (typeof response.remaining_seconds === "number") setTimeLeft(response.remaining_seconds);
    } catch (error) {
      questionHandledRef.current = false;
      setQuestionTimerPaused(false);
      setInterviewError(error.message || "Could not skip this question.");
    }
    finally { setIsSubmitting(false); }
  };

  const finishInterview = async (finalQuestions = questions) => {
    if (!sessionId || finishStartedRef.current) return;
    questionHandledRef.current = true;
    setQuestionTimerPaused(true);
    finishStartedRef.current = true;
    stopListening(); window.speechSynthesis?.cancel(); setIsSubmitting(true);
    try {
      const result = await interviewApi(`/interview/${sessionId}/complete`, { method: "POST" });
      setFinalResult(result);
      setPreviousScorecard(result);
      localStorage.removeItem("aiInterviewActiveSessionId");
      localStorage.setItem("aiInterviewLastResult", JSON.stringify({ completedAt: result.completed_at || new Date().toISOString(), setup, questions: finalQuestions, serverResult: result }));
      setQuestions(finalQuestions); setMode("results"); await exitFullscreen();
    } catch (error) {
      // If the server says the session is already completed, still show the returned error rather than silently hiding it.
      finishStartedRef.current = false;
      setInterviewError(error.message || "Could not complete the interview.");
    } finally { setIsSubmitting(false); }
  };

  const restartInterview = () => {
    finishStartedRef.current = false;
    setSecurityWarning(false);
    setSessionId(null); setFinalResult(null); setTimeLeft(600); setInterviewClockStarted(false); setIsIntroSpeaking(false); clockStartRequestedRef.current = false; setInterviewError(""); setTabSwitches(0);
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
                  {previousScorecard && (
  <button
    type="button"
    className="resume-view-button previous-scorecard-button"
    onClick={viewPreviousScorecard}
  >
    <FileText size={17} />
    Previous Scorecard
  </button>
)}
                </div>

                <div className="setup-fields resume-only-fields">
                  <div className="resume-view-row">
                    <div>
                      <span className="resume-label">Your resume</span>
                      <strong>{resumeInfo?.file_name || "No resume uploaded"}</strong>
                      <small>{resumeInfo ? "This saved resume will be used to personalise your interview." : "Upload a PDF resume from your Profile page before starting."}</small>
                    </div>
                    <button type="button" className="resume-view-button" onClick={viewResume} disabled={!resumeInfo}>
                      <FileText size={17} /> View Resume
                    </button>
                  </div>
                  <label>
                    <span>Interview Difficulty</span>
                    <select value={setup.difficulty} onChange={(event) => setSetup({ ...setup, type: "resume", difficulty: event.target.value, focus: "mixed" })}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>
                </div>

                {interviewError && <div className="interview-error" role="alert">{interviewError}</div>}
                <div className="interview-rules">
                  <h3>Before you begin</h3>
                  <ul>
                    <li>This is a resume-based interview. Questions cover your skills, projects, education, experience and relevant general interview topics.</li>
                    <li>You have 60 seconds for each question. Submit when ready; unanswered questions move on when time expires.</li>
                    <li>Use Hear Again to listen to the question again. The AI adapts follow-up questions to your answers.</li>
                    <li>You can start another interview after the six-hour cooldown.</li>
                  </ul>
                </div>
                <button
                  className="start-interview-button"
                  onClick={startInterview}
                  disabled={isSubmitting || !resumeInfo || cooldownSeconds > 0}
                >
                  <Mic size={20} />
                  {cooldownSeconds > 0 ? `Available in ${Math.floor(cooldownSeconds / 3600)}h ${Math.floor((cooldownSeconds % 3600) / 60)}m ${cooldownSeconds % 60}s` : "Start Interview"}
                </button>
                <div className="setup-bottom-actions">
  {cooldownSeconds > 0 && (
    <p className="cooldown-note">
      Your previous scorecard remains available during the cooldown.
    </p>
  )}
</div>
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
            {currentQuestion.questionType === "closing" ? "Final feedback question" : "Interview in progress"} · Question time {questionTimeLeft}s · Main timer {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
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

          <div className="question-section">
            <div className="question-heading-row">
              <span className="question-label">
                {currentQuestion.questionType === "closing"
                  ? "FINAL FEEDBACK QUESTION"
                  : currentQuestion.skipped
                    ? "RETURNING TO SKIPPED QUESTION"
                    : "INTERVIEW QUESTION"}
              </span>
              <div className="question-meta">
                <span>{setup.difficulty.charAt(0).toUpperCase() + setup.difficulty.slice(1)}</span>
                <span>{setup.type === "resume" ? "Resume Based" : setup.type}</span>
              </div>
            </div>
            <h1>{currentQuestion.question}</h1>
            {isSpeaking && !isIntroSpeaking && (
              <div className="question-reading-actions">
                <button type="button" className="stop-reading-button" onClick={stopQuestionReading} disabled={isSubmitting}>
                  <Square size={14} /> Stop Reading
                </button>
              </div>
            )}
          </div>

          <div className="ai-interviewer ai-interviewer-compact">
            <div className={`ai-wave-container ${isListening ? "listening" : ""} ${isSpeaking ? "speaking" : ""}`}>
              <div className="voice-waves">
                <span /><span /><span /><span /><span /><span /><span /><span /><span />
              </div>
              <div className="ai-core"><Sparkles size={27} /></div>
            </div>
            <div className="ai-status">
              {isSpeaking ? "AI is asking the question..." : isListening ? "Listening to your answer..." : "Ready"}
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
                    <p>Speak naturally. The transcript stays hidden during the interview.</p>
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
                        : "Recording continues until you submit or the 60-second question timer expires."}
                    </p>
                  </div>
                </>
              )}
            </div>


</div>

          {interviewError && <div className={`interview-status-line ${/could not|failed|error|haven't/i.test(interviewError) ? "is-error" : ""}`} role="status">{interviewError}</div>}
          {micError && <div className="interview-status-line is-error" role="status">{micError}</div>}
          {isCodeWritingPrompt(currentQuestion.question) && (
            <div className="code-pad-toolbar">
              <button
                type="button"
                className={`code-pad-toggle ${submittedCode ? "has-code" : ""}`}
                onClick={() => setCodePadOpen(true)}
                disabled={isSubmitting}
              >
                <Code2 size={17} />
                {submittedCode ? "Edit Code Submission" : "Open Coding Pad"}
              </button>
              <span>{submittedCode ? `Code submitted (${codeLanguage})` : "This question requires a code or query solution."}</span>
            </div>
          )}

          <div className="interview-controls interview-controls-updated">
            <button className="listen-again-button" onClick={() => { setEmptyAnswerWarning(""); stopListening(); speakQuestion(currentQuestion.question); }} disabled={isSubmitting || isSpeaking}>
              <RotateCcw size={17} /> Hear Again
            </button>
            <div className="question-timer-control" aria-label={`Question time remaining: ${questionTimeLeft} seconds`}>
              <div className="question-timer-label"><span>TIME REMAINING</span><strong>00:{String(questionTimeLeft).padStart(2, "0")}</strong></div>
              <div className="question-timer-track"><div className={`question-timer-fill ${questionTimeLeft <= 10 ? "is-low" : ""}`} style={{ width: `${Math.max(0, Math.min(100, ((60 - questionTimeLeft) / 60) * 100))}%` }} /></div>
            </div>
            <button className="submit-answer-button" onClick={() => void submitCurrentAnswer(false)} disabled={isSubmitting || Boolean(emptyAnswerWarning)}>
              <CheckCircle2 size={17} /> {isSubmitting ? "Submitting…" : "Submit Answer"}
            </button>
          </div>
          <div className="end-interview-row">
            <button className="end-interview-button" onClick={() => { if (window.confirm("End the interview now? Your answers so far will be saved.")) void finishInterview(questions); }} disabled={isSubmitting}>End interview</button>
          </div>
        </section>

        {codePadOpen && mode === "interview" && currentQuestion && isCodeWritingPrompt(currentQuestion.question) && (
          <div className="code-pad-backdrop" role="dialog" aria-modal="true" aria-labelledby="code-pad-title">
            <section className="code-pad-dialog">
              <header className="code-pad-header">
                <div>
                  <span className="code-pad-kicker"><Code2 size={15} /> CODING WORKSPACE</span>
                  <h2 id="code-pad-title">Write your solution</h2>
                  <p>Your code will be included in the AI evaluation when you submit your interview answer.</p>
                </div>
                <button type="button" className="code-pad-close" onClick={() => setCodePadOpen(false)} aria-label="Close coding pad">
                  <span>×</span>
                </button>
              </header>
              <div className="code-pad-language-row">
                <label htmlFor="code-pad-language">Language</label>
                <select id="code-pad-language" value={codeLanguage} onChange={(event) => setCodeLanguage(event.target.value)}>
                  <option>Plain Text</option>
                  <option>SQL</option>
                  <option>Python</option>
                  <option>Java</option>
                  <option>JavaScript</option>
                  <option>C++</option>
                </select>
                <span>{questionTimeLeft}s remaining</span>
              </div>
              <textarea
                className="code-pad-editor"
                value={codePadDraft}
                onChange={(event) => setCodePadDraft(event.target.value)}
                placeholder={codeLanguage === "SQL" ? "-- Write your SQL query here..." : "// Write your solution here..."}
                spellCheck="false"
                autoCapitalize="off"
                autoCorrect="off"
                aria-label="Code editor"
              />
              {submittedCode && (
                <p className="code-pad-saved-note"><CheckCircle2 size={15} /> A code submission is saved for this question. Submitting again will replace it.</p>
              )}
              <footer className="code-pad-actions">
                <button type="button" className="code-pad-cancel" onClick={() => setCodePadOpen(false)}>Continue Interview</button>
                <button
                  type="button"
                  className="code-pad-submit"
                  onClick={() => {
                    if (!codePadDraft.trim()) return;
                    setSubmittedCode(codePadDraft);
                    setCodePadOpen(false);
                    setInterviewError("Code saved for this question. Submit your answer before the timer expires.");
                  }}
                  disabled={!codePadDraft.trim() || isSubmitting}
                >
                  <CheckCircle2 size={16} /> Submit Code
                </button>
              </footer>
            </section>
          </div>
        )}

        {emptyAnswerWarning && mode === "interview" && (
          <div className="security-warning-backdrop empty-answer-backdrop" role="dialog" aria-modal="true" aria-labelledby="empty-answer-title">
            <div className="security-warning-card empty-answer-card">
              <AlertCircle size={32} />
              <h2 id="empty-answer-title">No answer detected</h2>
              <p>{emptyAnswerWarning}</p>
              <div className="empty-answer-actions">
                <button type="button" className="secondary-warning-button" onClick={() => {
                  setEmptyAnswerWarning("");
                  setQuestionTimerPaused(false);
                  setInterviewError("");
                  if (!isSpeaking && !isListening) void startListening();
                }}>Keep Answering</button>
                <button type="button" onClick={() => {
                  setEmptyAnswerWarning("");
                  void skipQuestion();
                }}>Skip Question</button>
              </div>
            </div>
          </div>
        )}

        {securityWarning && mode === "interview" && (
          <div className="security-warning-backdrop" role="dialog" aria-modal="true" aria-labelledby="security-warning-title">
            <div className="security-warning-card">
              <ShieldCheck size={32} />
              <h2 id="security-warning-title">Interview focus warning</h2>
              <p>We detected that you left the interview tab/window or exited full screen. Please return to the interview. Three violations will end the interview.</p>
              <p className="security-countdown">Warning {tabSwitches} of 3</p>
              <button onClick={async () => {
                try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); } catch {}
                wasFullscreenRef.current = Boolean(document.fullscreenElement);
                setSecurityWarning(false);
                setInterviewError(`Warning ${tabSwitches} of 3: please remain in the interview window.`);
              }}>Return to Interview</button>
            </div>
          </div>
        )}

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

            <p className="results-description">Your interview has been saved. Review the result returned by the interview service below.</p>

            <div className="results-summary-grid">
              <div>
                <span>Score</span>
                <strong>{finalResult?.overall_score ?? "Not evaluated"}{finalResult?.overall_score != null ? "/100" : ""}</strong>
              </div>
              <div>
                <span>Total Questions</span>
                <strong>{finalResult?.total_questions ?? questions.length}</strong>
              </div>

              <div>
                <span>Answered</span>
                <strong>{finalResult?.answered_questions ?? answeredQuestions.length}</strong>
              </div>

              <div>
                <span>Skipped</span>
                <strong>
                  {finalResult?.skipped_questions ?? questions.filter((question) => question.skipped).length}
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
                <p>{finalResult?.message || "Your interview result has been saved."}</p>
              </div>
            </div>

            {finalResult?.dimension_scores && (
              <section className="interview-dimension-report">
                <h2>Skill Breakdown</h2>
                <div className="interview-dimension-grid">
                  {Object.entries(finalResult.dimension_scores).map(([key, value]) => (
                    <div key={key}>
                      <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      <strong>{value == null ? "Not evaluated" : `${Math.round(value)}/100`}</strong>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {Array.isArray(finalResult?.answer_feedback) && finalResult.answer_feedback.length > 0 && (
              <section className="interview-answer-report">
                <h2>Question-by-question feedback</h2>
                {finalResult.answer_feedback.map((item) => (
                  <article className="interview-answer-report-item" key={item.question_number}>
                    <h3>Q{item.question_number}. {item.question}</h3>
                    {item.answer_seconds != null && <p className="answer-duration-note">Answered in {item.answer_seconds} seconds</p>}
                    <p><strong>Your answer:</strong> {item.answer || "No answer submitted."}</p>
                    <div className="interview-report-scores">
                      <span>Correctness {item.correctness == null ? "Not evaluated" : `${Math.round(item.correctness)}/100`}</span>
                      <span>Relevance {item.relevance == null ? "Not evaluated" : `${Math.round(item.relevance)}/100`}</span>
                      <span>Clarity {item.clarity == null ? "Not evaluated" : `${Math.round(item.clarity)}/100`}</span>
                      <span>Completeness {item.completeness == null ? "Not evaluated" : `${Math.round(item.completeness)}/100`}</span>
                    </div>
                    <p><strong>Feedback:</strong> {item.feedback || "No feedback returned."}</p>
                    {item.suggested_answer && <p><strong>Stronger answer example:</strong> {item.suggested_answer}</p>}
                  </article>
                ))}
              </section>
            )}

            <div className="results-actions print-actions">
              <button type="button" className="secondary-results-button print-scorecard-button" onClick={() => window.print()}><Printer size={18} /> Print / Save as PDF</button>
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