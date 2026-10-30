import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic, MicOff, Sparkles, ShieldCheck, Clock3, Pause, Play, RotateCcw,
  ArrowRight, CheckCircle2, Volume2, MessageCircle, Brain, Gauge, Award,
  AlertCircle, LayoutDashboard, Square, ScanFace,
} from "lucide-react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import Navbar1 from "../components/Navbar1";
import api from "../services/api";
import "../styles/speaking.css";

const prompts = {
  general: {
    easy: [
      "Tell me about yourself.", "What are your strengths?", "What is one area you are working to improve?", "Why did you choose your field of study?", "What are your short-term career goals?", "What do you know about this role?", "Why are you interested in this company?", "What motivates you to do your best work?"
    ],
    medium: [
      "Why should we hire you over other candidates?", "Describe an achievement you are proud of and why it matters.", "What kind of work environment helps you perform best?", "Where do you see yourself in five years, and how does this role fit?", "What would your classmates or teammates say about you?", "What are your expectations from your first job?", "How do you respond to constructive feedback?", "What makes you a good fit for our organization?"
    ],
    hard: [
      "Why should we select you if another candidate has more experience?", "Explain a gap or setback in your profile and what you learned from it.", "What would you do if the role differed from your expectations after joining?", "What is one professional weakness that could affect this role, and how are you addressing it?", "How would you justify your suitability for this position with limited work experience?", "If we do not select you today, what do you think the reason might be?", "How do you define career success beyond salary and designation?", "What would make you leave a job within the first year?"
    ]
  },
  behavioral: {
    easy: [
      "Tell me about a time you worked successfully with a team.", "Describe a time you helped someone who needed support.", "Tell me about a task you completed on time.", "Describe a time you learned something quickly.", "Tell me about a time you took responsibility for your work.", "Describe a time you received positive feedback.", "Tell me about a time you had to listen carefully to someone.", "Describe a time you showed initiative in college or a project."
    ],
    medium: [
      "Tell me about a disagreement with a teammate and how you resolved it.", "Describe a mistake you made and the steps you took afterward.", "Tell me about a time you handled pressure while meeting a deadline.", "Describe a time you received difficult feedback and acted on it.", "Tell me about a project where your contribution made a difference.", "Describe a time you had to balance multiple responsibilities.", "Tell me about a time you persuaded others to consider your idea.", "Describe a situation where you had to adapt to a sudden change."
    ],
    hard: [
      "Describe a team failure you were part of. What was your responsibility and what changed afterward?", "Tell me about a conflict where you later realized the other person had a valid point.", "Describe a time you had to make a difficult decision with incomplete information.", "Tell me about a time you challenged a decision made by someone senior to you.", "Describe a situation where your first approach failed and you had to recover quickly.", "Tell me about a time you had to deliver an unpopular message or decision.", "Describe a time you had competing priorities and explain how you justified your final choice.", "Tell me about a situation where you had to rebuild trust after a misunderstanding."
    ]
  },
  situational: {
    easy: [
      "If you do not understand a task assigned by your manager, what would you do?", "If you made a small mistake at work, how would you handle it?", "If a teammate asked for help while you had your own task, what would you do?", "If you were running late for an important meeting, how would you respond?", "If you received feedback you did not expect, how would you react?", "If you had to learn a new tool quickly, how would you begin?", "If a colleague misunderstood your message, how would you clarify it?", "If you finished your work early, what would you do next?"
    ],
    medium: [
      "Your manager assigns two urgent tasks with the same deadline. How would you prioritize them?", "A teammate is not completing their share of a group task. How would you handle it?", "A customer is upset about a delay you did not cause. What would you say and do?", "You realize you may miss a deadline. How would you communicate this?", "Your manager gives you feedback that you disagree with. How would you respond?", "You are asked to do a task you have never done before with little guidance. What is your plan?", "Two colleagues give you conflicting instructions. How would you proceed?", "You notice a process could be improved, but nobody has asked you to change it. What would you do?"
    ],
    hard: [
      "Your manager asks you to take responsibility for a mistake you did not make. How would you handle the discussion?", "A high-priority task conflicts with a company policy. What would you do?", "A teammate takes credit for your contribution in front of leadership. How would you respond?", "You are assigned an unrealistic deadline and cannot meet it without reducing quality. How would you manage expectations?", "You discover a colleague has shared confidential information by mistake. What steps would you take?", "A senior colleague dismisses your idea without hearing your reasoning. How would you handle it professionally?", "You have to choose between helping a teammate and protecting a deadline you own. How would you decide?", "You join a team where morale is low and people resist change. What would you do in your first few weeks?"
    ]
  }
};

const modeLabels = { general: "General HR Round", behavioral: "Behavioral HR Round", situational: "Situational HR Round" };

function buildPrompts(mode, count, difficulty) {
  const bank = prompts[mode]?.[difficulty] || prompts.general.medium;
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, index) => ({
    id: `${mode}-${difficulty}-${Date.now()}-${index}`,
    number: index + 1,
    prompt: shuffled[index % shuffled.length],
    answer: "",
    completed: false,
  }));
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds || 0);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

function getErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail?.message) return detail.message;
  return fallback;
}

function formatAvailableAt(value) {
  if (!value) return "the end of the five-hour cooldown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "the end of the five-hour cooldown" : date.toLocaleString();
}

function speak(text, onEnd) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((item) => /en-IN/i.test(item.lang)) || voices.find((item) => /en-US/i.test(item.lang)) || voices.find((item) => /^en/i.test(item.lang));
  if (voice) utterance.voice = voice;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

export default function SpeakingPractice() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("general");
  const [difficulty, setDifficulty] = useState("medium");
  const [promptCount, setPromptCount] = useState(3);
  const [screen, setScreen] = useState("setup");
  const [promptsList, setPromptsList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [faceStatus, setFaceStatus] = useState("Checking camera...");
  const [remainingSeconds, setRemainingSeconds] = useState(promptCount * 120);
  const [questionRemaining, setQuestionRemaining] = useState(120);
  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [results, setResults] = useState(null);
  const [availability, setAvailability] = useState({ loading: true, allowed: false, reason: null, available_at: null, retry_after_seconds: null });
  const [isStarting, setIsStarting] = useState(false);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [proctorWarning, setProctorWarning] = useState(null);
  const [cameraWarningCount, setCameraWarningCount] = useState(0);
  const [tabWarningCount, setTabWarningCount] = useState(0);
  const [totalWarningCount, setTotalWarningCount] = useState(0);
  const [terminationReason, setTerminationReason] = useState(null);

  const videoRef = useRef(null);
  const videoStreamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const stopRecorderPromiseRef = useRef(null);
  const pendingRecordingsRef = useRef({});
  const recordingStartedAtRef = useRef(0);
  const sessionIdRef = useRef(null);
  const promptsRef = useRef([]);
  const answersRef = useRef({});
  const currentIndexRef = useRef(0);
  const screenRef = useRef("setup");
  const pausedRef = useRef(false);
  const finishingRef = useRef(false);
  const processingRef = useRef(false);
  const questionElapsedRef = useRef(0);
  const autoAdvanceTriggeredRef = useRef(false);
  const timeLimitReachedRef = useRef(false);
  const overallElapsedRef = useRef(0);
  const faceLandmarkerRef = useRef(null);
  const faceAnimationRef = useRef(0);
  const faceStatsRef = useRef({ checks: 0, face_detected_checks: 0, face_missing_checks: 0, face_multiple_checks: 0, last_face_detected: false, last_face_count: 0, detector_ready: false, detector_error: null });
  const lastFaceUiUpdateRef = useRef(0);
  const cameraWarningsRef = useRef(0);
  const tabWarningsRef = useRef(0);
  const totalWarningsRef = useRef(0);
  const faceInvalidEpisodeRef = useRef(false);
  const proctorBlockedRef = useRef(false);
  const proctorWasPausedRef = useRef(false);
  const proctorWasSpeakingRef = useRef(false);
  const proctorWasRecordingRef = useRef(false);
  const pendingProctorTerminationRef = useRef(null);
  const finishRef = useRef(null);
  const currentPrompt = promptsList[currentIndex];

  const refreshAvailability = useCallback(async () => {
    try {
      const response = await api.get("/speaking/availability");
      setAvailability({ loading: false, ...response.data });
    } catch (error) {
      setAvailability({ loading: false, allowed: false, reason: "server_error", available_at: null, retry_after_seconds: null });
      setMicError(getErrorMessage(error, "Could not check speaking-test availability. Make sure the backend is running and you are logged in."));
    }
  }, []);

  useEffect(() => { refreshAvailability(); }, [refreshAvailability]);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { promptsRef.current = promptsList; }, [promptsList]);
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  const stopTracks = useCallback(() => {
    videoStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    videoStreamRef.current = null;
    audioStreamRef.current = null;
  }, []);

  const startRecording = useCallback(() => {
    if (!audioStreamRef.current || finishingRef.current || pausedRef.current) return;
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") return;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : (MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "");
      const recorder = mimeType ? new MediaRecorder(audioStreamRef.current, { mimeType }) : new MediaRecorder(audioStreamRef.current);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data?.size) chunksRef.current.push(event.data); };
      recorder.onstart = () => { setIsListening(true); setMicError(""); recordingStartedAtRef.current = Date.now(); };
      recorder.onstop = () => {
        setIsListening(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const resolve = stopRecorderPromiseRef.current;
        stopRecorderPromiseRef.current = null;
        resolve?.({ blob, durationSeconds: Math.max(0, (Date.now() - recordingStartedAtRef.current) / 1000) });
      };
      recorder.onerror = () => { setIsListening(false); setMicError("Microphone recording failed. Check microphone permission and try again."); };
      mediaRecorderRef.current = recorder;
      recorder.start(500);
    } catch {
      setIsListening(false);
      setMicError("Your browser could not start microphone recording. Use the latest Chrome or Edge and allow microphone access.");
    }
  }, []);

  const stopAndTranscribe = useCallback(async (index) => {
    const recorder = mediaRecorderRef.current;
    let recording = pendingRecordingsRef.current[index] || null;
    if (recorder && recorder.state !== "inactive") {
      recording = await new Promise((resolve) => {
        stopRecorderPromiseRef.current = resolve;
        try { recorder.stop(); } catch { stopRecorderPromiseRef.current = null; resolve({ blob: new Blob([], { type: "audio/webm" }), durationSeconds: 0 }); }
      });
    }
    mediaRecorderRef.current = null;
    if (recording) pendingRecordingsRef.current[index] = recording;
    if (!recording?.blob || recording.blob.size < 1000 || !sessionIdRef.current) {
      const previous = answersRef.current[index] || { transcript: "", metrics: {} };
      setTranscript(previous.transcript || "");
      return previous;
    }
    setIsProcessingAnswer(true);
    setMicError("");
    try {
      const formData = new FormData();
      formData.append("question_index", String(index));
      formData.append("prompt", promptsRef.current[index]?.prompt || "");
      formData.append("duration_seconds", String(recording.durationSeconds));
      const extension = recording.blob.type.includes("mp4") ? "m4a" : (recording.blob.type.includes("ogg") ? "ogg" : "webm");
      formData.append("audio", recording.blob, `speaking-answer-${index + 1}.${extension}`);
      const response = await api.post(`/speaking/${sessionIdRef.current}/answer`, formData, { headers: { "Content-Type": "multipart/form-data" }, timeout: 100000 });
      const answer = { transcript: response.data.transcript || "", metrics: response.data.metrics || {}, words: response.data.words || [] };
      delete pendingRecordingsRef.current[index];
      answersRef.current[index] = answer;
      setTranscript(answer.transcript);
      setPromptsList((previous) => previous.map((item, itemIndex) => itemIndex === index ? { ...item, answer: answer.transcript, completed: Boolean(answer.transcript) } : item));
      if (!answer.transcript) setMicError("We could not recognize speech in that answer. Check the microphone and try speaking clearly in the next question.");
      return answer;
    } catch (error) {
      const message = getErrorMessage(error, "Transcription failed. Your current answer could not be processed.");
      setMicError(message);
      throw error;
    } finally {
      setIsProcessingAnswer(false);
    }
  }, []);

  const askPrompt = useCallback((text) => {
    if (pausedRef.current || finishingRef.current || proctorBlockedRef.current) return;
    setIsSpeaking(true);
    speak(text, () => {
      setIsSpeaking(false);
      if (!pausedRef.current && !proctorBlockedRef.current && screenRef.current === "practice") startRecording();
    });
  }, [startRecording]);

  const raiseProctorWarning = useCallback((type, count, detail = "") => {
    if (screenRef.current !== "practice" || finishingRef.current) return;

    if (!proctorBlockedRef.current) {
      proctorWasPausedRef.current = pausedRef.current;
      proctorWasSpeakingRef.current = Boolean(window.speechSynthesis?.speaking);
      proctorWasRecordingRef.current = mediaRecorderRef.current?.state === "recording";
      proctorBlockedRef.current = true;
      pausedRef.current = true;
      setIsPaused(true);
      window.speechSynthesis?.pause();
      try {
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.pause();
      } catch { /* Keep the current recording safe if pausing is unsupported. */ }
    }

    const message = count >= 3
      ? "You have reached 3 total warnings across camera and tab switching. The test is ending automatically and your available answers will be evaluated."
      : detail;
    setProctorWarning({ type, count, limit: 3, message, final: count >= 3 });

    if (count >= 3) {
      pendingProctorTerminationRef.current = "warning_limit";
      setTerminationReason("warning_limit");
      if (!processingRef.current && !finishingRef.current) {
        finishRef.current?.(false, "warning_limit");
      }
    }
  }, []);

  const acknowledgeProctorWarning = () => {
    if (!proctorWarning || proctorWarning.count >= 3 || finishingRef.current) return;
    if (document.visibilityState === "hidden") return;
    if (!faceStatsRef.current.detector_ready || faceStatsRef.current.last_face_count !== 1) {
      setProctorWarning((previous) => previous ? {
        ...previous,
        message: "To continue, return to the camera and make sure exactly one face is visible. Then click Continue Test again.",
      } : previous);
      return;
    }

    // Start a new camera-warning episode only after the user explicitly acknowledges
    // the current warning. Do not reset this just because one video frame detects a face.
    faceInvalidEpisodeRef.current = false;

    const wasManuallyPaused = proctorWasPausedRef.current;
    const wasSpeaking = proctorWasSpeakingRef.current;
    const wasRecording = proctorWasRecordingRef.current;
    proctorBlockedRef.current = false;
    setProctorWarning(null);

    if (wasManuallyPaused) {
      pausedRef.current = true;
      setIsPaused(true);
      return;
    }

    pausedRef.current = false;
    setIsPaused(false);
    if (wasSpeaking) {
      window.speechSynthesis?.resume();
    }
    const recorder = mediaRecorderRef.current;
    try {
      if (recorder?.state === "paused") recorder.resume();
      else if (wasRecording && recorder?.state === "inactive") startRecording();
      else if (!wasSpeaking && !wasRecording && !processingRef.current) {
        const prompt = promptsRef.current[currentIndexRef.current]?.prompt;
        if (prompt) askPrompt(prompt);
      }
    } catch { /* A later prompt/recording start can recover from browser media errors. */ }
  };

  useEffect(() => {
    if (screen !== "practice" || !videoStreamRef.current) return undefined;
    let cancelled = false;
    const video = videoRef.current;
    if (video) {
      video.srcObject = videoStreamRef.current;
      video.play().catch(() => {});
    }
    async function initializeFaceLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm");

        const modelAssetPath = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
        const landmarkerOptions = {
          runningMode: "VIDEO", numFaces: 3,
          minFaceDetectionConfidence: 0.5, minFacePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
        };
        let landmarker;
        try {
          landmarker = await FaceLandmarker.createFromOptions(vision, { ...landmarkerOptions, baseOptions: { modelAssetPath, delegate: "GPU" } });
        } catch {
          landmarker = await FaceLandmarker.createFromOptions(vision, { ...landmarkerOptions, baseOptions: { modelAssetPath } });
        }
        if (cancelled) { landmarker.close(); return; }
        faceLandmarkerRef.current = landmarker;
        faceStatsRef.current.detector_ready = true;
        faceStatsRef.current.detector_error = null;
        setFaceStatus("Face detection ready; checking face count…");
        let lastDetectionAt = 0;
        const detect = (now) => {
          if (cancelled) return;
          const currentVideo = videoRef.current;
          if (currentVideo && currentVideo.readyState >= 2 && now - lastDetectionAt >= 200) {
            lastDetectionAt = now;
            try {
              const faceCount = landmarker.detectForVideo(currentVideo, now).faceLandmarks?.length ?? 0;
              faceStatsRef.current.checks += 1;
              faceStatsRef.current.last_face_count = faceCount;
              if (faceCount === 1) faceStatsRef.current.face_detected_checks += 1;
              else if (faceCount === 0) faceStatsRef.current.face_missing_checks += 1;
              else faceStatsRef.current.face_multiple_checks += 1;
              faceStatsRef.current.last_face_detected = faceCount === 1;
              if (faceCount === 1) {
                // While a warning is waiting for Continue Test, keep the current
                // invalid-camera episode latched. This prevents frame-to-frame
                // detection flicker from adding warnings without user action.
                if (!proctorBlockedRef.current) faceInvalidEpisodeRef.current = false;
              } else if (!faceInvalidEpisodeRef.current) {
                faceInvalidEpisodeRef.current = true;
                cameraWarningsRef.current += 1;
                setCameraWarningCount(cameraWarningsRef.current);
                totalWarningsRef.current += 1;
                setTotalWarningCount(totalWarningsRef.current);
                const detail = faceCount === 0
                  ? "No face detected. The test is paused. Return to the camera so exactly one face is visible, then acknowledge this warning."
                  : `Multiple faces detected (${faceCount}). The test is paused. Only one face should be visible before you continue.`;
                raiseProctorWarning("camera", totalWarningsRef.current, detail);
              }
              if (now - lastFaceUiUpdateRef.current > 1000) {
                if (faceCount === 1) setFaceStatus("Exactly one face detected");
                else if (faceCount === 0) setFaceStatus("No face detected — look toward the camera");
                else setFaceStatus(`Multiple faces detected (${faceCount}) — only you should be visible`);
                lastFaceUiUpdateRef.current = now;
              }
            } catch { /* A transient video frame can be skipped safely. */ }
          }
          faceAnimationRef.current = requestAnimationFrame(detect);
        };
        faceAnimationRef.current = requestAnimationFrame(detect);
      } catch (error) {
        faceStatsRef.current.detector_ready = false;
        faceStatsRef.current.detector_error = String(error?.message || error || "Unknown MediaPipe error");
        console.error("MediaPipe face detector initialization failed:", error);
        setFaceStatus("Face detection unavailable; check browser Console and internet connection");
      }
    }
    initializeFaceLandmarker();
    return () => {
      cancelled = true;
      cancelAnimationFrame(faceAnimationRef.current);
      faceLandmarkerRef.current?.close();
      faceLandmarkerRef.current = null;
    };
  }, [screen, raiseProctorWarning]);

  useEffect(() => () => {
    try { if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current?.stop(); } catch {}
    window.speechSynthesis?.cancel();
    stopTracks();
    faceLandmarkerRef.current?.close();
    cancelAnimationFrame(faceAnimationRef.current);
  }, [stopTracks]);

  useEffect(() => {
    if (screen !== "practice") return undefined;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Force the banner to re-render so its Continue button can be enabled on return.
        setProctorWarning((previous) => previous ? { ...previous } : previous);
        return;
      }
      if (screenRef.current !== "practice" || finishingRef.current) return;
      tabWarningsRef.current += 1;
      setTabWarningCount(tabWarningsRef.current);
      totalWarningsRef.current += 1;
      setTotalWarningCount(totalWarningsRef.current);
      raiseProctorWarning(
        "tab_switch",
        totalWarningsRef.current,
        "Switching tabs or minimizing the browser is not allowed during the speaking test. Return to this tab and acknowledge the warning to continue.",
      );
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [screen, raiseProctorWarning]);

  const enterFullscreen = async () => {
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); } catch { /* Fullscreen is optional in some browsers. */ }
  };
  const exitFullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* Ignore browser fullscreen errors. */ }
  };

  const startPractice = async () => {
    setMicError("");
    setIsStarting(true);
    let videoStream;
    let audioStream;
    try {
      const currentAvailability = await api.get("/speaking/availability");
      setAvailability({ loading: false, ...currentAvailability.data });
      if (!currentAvailability.data.allowed) {
        setMicError(currentAvailability.data.reason === "cooldown" ? `Your next speaking test is available at ${formatAvailableAt(currentAvailability.data.available_at)}.` : "You already have a speaking test in progress. Release the old session only if you are sure it is no longer running.");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("This browser does not support camera/microphone recording. Please use a current version of Chrome or Edge.");
      videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      const generated = buildPrompts(mode, promptCount, difficulty);
      const response = await api.post("/speaking/start", { mode, difficulty, prompts: generated.map((item) => item.prompt) });
      sessionIdRef.current = response.data.session_id;
      videoStreamRef.current = videoStream;
      audioStreamRef.current = audioStream;
      promptsRef.current = generated;
      answersRef.current = {};
      setPromptsList(generated);
      setCurrentIndex(0);
      currentIndexRef.current = 0;
      setRemainingSeconds(promptCount * 120);
      setQuestionRemaining(120);
      setPracticeSeconds(0);
      overallElapsedRef.current = 0;
      questionElapsedRef.current = 0;
      autoAdvanceTriggeredRef.current = false;
      timeLimitReachedRef.current = false;
      finishingRef.current = false;
      processingRef.current = false;
      faceStatsRef.current = { checks: 0, face_detected_checks: 0, face_missing_checks: 0, face_multiple_checks: 0, last_face_detected: false, last_face_count: 0, detector_ready: false, detector_error: null };
      cameraWarningsRef.current = 0;
      tabWarningsRef.current = 0;
      totalWarningsRef.current = 0;
      faceInvalidEpisodeRef.current = false;
      proctorBlockedRef.current = false;
      proctorWasPausedRef.current = false;
      proctorWasSpeakingRef.current = false;
      proctorWasRecordingRef.current = false;
      pendingProctorTerminationRef.current = null;
      setProctorWarning(null);
      setCameraWarningCount(0);
      setTabWarningCount(0);
      setTotalWarningCount(0);
      setTerminationReason(null);
      setResults(null);
      setIsPaused(false);
      setScreen("practice");
      await enterFullscreen();
    } catch (error) {
      videoStream?.getTracks().forEach((track) => track.stop());
      audioStream?.getTracks().forEach((track) => track.stop());
      const message = getErrorMessage(error, error?.message || "Could not start speaking practice. Check permissions and backend configuration.");
      setMicError(message);
      if (sessionIdRef.current) {
        try { await api.post(`/speaking/${sessionIdRef.current}/abandon`); } catch {}
        sessionIdRef.current = null;
      }
    } finally {
      setIsStarting(false);
    }
  };

  const finishPractice = useCallback(async (currentAnswerAlreadyUploaded = false, proctorTermination = null) => {
    if (finishingRef.current || !sessionIdRef.current) return;
    const finalTerminationReason = proctorTermination || pendingProctorTerminationRef.current || null;
    finishingRef.current = true;
    setIsEvaluating(true);
    setMicError("");
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    try {
      if (!currentAnswerAlreadyUploaded) {
        try { await stopAndTranscribe(currentIndexRef.current); }
        catch { finishingRef.current = false; setIsEvaluating(false); return; }
      }
      const response = await api.post(`/speaking/${sessionIdRef.current}/finish`, {
        face_stats: { ...faceStatsRef.current, face_detection_runs: faceStatsRef.current.checks, face_detected_percentage: faceStatsRef.current.checks ? Math.round(faceStatsRef.current.face_detected_checks / faceStatsRef.current.checks * 100) : null, frames_processed_locally: true },
        camera_warnings: cameraWarningsRef.current,
        tab_switch_warnings: tabWarningsRef.current,
        warning_count: totalWarningsRef.current,
        termination_reason: finalTerminationReason,
      }, { timeout: 100000 });
      const data = response.data;
      setResults(data);
      setTerminationReason(finalTerminationReason);
      setProctorWarning(null);
      proctorBlockedRef.current = false;
      setScreen("results");
      stopTracks();
      await exitFullscreen();
      sessionIdRef.current = null;
      await refreshAvailability();
    } catch (error) {
      setMicError(getErrorMessage(error, "AI evaluation failed. Your recorded answers are saved; please try finishing again."));
      finishingRef.current = false;
    } finally {
      setIsEvaluating(false);
    }
  }, [refreshAvailability, stopAndTranscribe, stopTracks]);

  const advanceQuestion = useCallback(async () => {
    if (processingRef.current || finishingRef.current || screenRef.current !== "practice") return;
    processingRef.current = true;
    setMicError("");
    try {
      await stopAndTranscribe(currentIndexRef.current);
      const pendingTermination = pendingProctorTerminationRef.current;
      if (pendingTermination) {
        processingRef.current = false;
        await finishPractice(true, pendingTermination);
        return;
      }
      const index = currentIndexRef.current;
      if (index >= promptsRef.current.length - 1 || remainingSeconds <= 1) {
        processingRef.current = false;
        await finishPractice(true);
        return;
      }
      const nextIndex = index + 1;
      currentIndexRef.current = nextIndex;
      questionElapsedRef.current = 0;
      autoAdvanceTriggeredRef.current = false;
      setQuestionRemaining(120);
      setCurrentIndex(nextIndex);
    } catch {
      // Keep the user on this question if transcription failed; a pending proctoring termination can retry it.
      if (pendingProctorTerminationRef.current && !finishingRef.current) {
        const pendingTermination = pendingProctorTerminationRef.current;
        processingRef.current = false;
        await finishPractice(false, pendingTermination);
      }
    } finally {
      processingRef.current = false;
    }
  }, [finishPractice, remainingSeconds, stopAndTranscribe]);

  const advanceRef = useRef(advanceQuestion);
  useEffect(() => { advanceRef.current = advanceQuestion; }, [advanceQuestion]);
  useEffect(() => { finishRef.current = finishPractice; }, [finishPractice]);

  useEffect(() => {
    if (screen !== "practice" || isPaused) return undefined;
    const interval = setInterval(() => {
      overallElapsedRef.current += 1;
      questionElapsedRef.current += 1;
      setPracticeSeconds(overallElapsedRef.current);
      setRemainingSeconds((previous) => Math.max(0, previous - 1));
      setQuestionRemaining(Math.max(0, 120 - questionElapsedRef.current));
      if (overallElapsedRef.current >= promptCount * 120 && !timeLimitReachedRef.current) {
        timeLimitReachedRef.current = true;
        finishRef.current();
      } else if (questionElapsedRef.current >= 120 && !autoAdvanceTriggeredRef.current) {
        autoAdvanceTriggeredRef.current = true;
        advanceRef.current();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, isPaused, promptCount]);

  useEffect(() => {
    if (screen !== "practice" || !currentPrompt || isPaused) return undefined;
    const timer = setTimeout(() => askPrompt(currentPrompt.prompt), 400);
    return () => clearTimeout(timer);
  }, [currentIndex, screen]);

  const nextPrompt = async () => {
    if (processingRef.current || isSpeaking || isPaused) return;
    await advanceQuestion();
  };

  const retryPrompt = async () => {
    if (isSpeaking || isPaused || processingRef.current) return;
    try {
      const index = currentIndexRef.current;
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        await new Promise((resolve) => {
          stopRecorderPromiseRef.current = resolve;
          try { recorder.stop(); } catch { stopRecorderPromiseRef.current = null; resolve(null); }
        });
      }
      mediaRecorderRef.current = null;
      delete pendingRecordingsRef.current[index];
      const clearForm = new FormData();
      clearForm.append("question_index", String(index));
      clearForm.append("prompt", promptsRef.current[index]?.prompt || "");
      clearForm.append("duration_seconds", "0");
      await api.post(`/speaking/${sessionIdRef.current}/answer`, clearForm, { headers: { "Content-Type": "multipart/form-data" } });
      delete answersRef.current[index];
      setTranscript("");
      setPromptsList((previous) => previous.map((item, index) => index === currentIndexRef.current ? { ...item, answer: "", completed: false } : item));
      questionElapsedRef.current = 0;
      autoAdvanceTriggeredRef.current = false;
      setQuestionRemaining(120);
      askPrompt(promptsRef.current[currentIndexRef.current].prompt);
    } catch { /* Keep the error shown by the transcription request. */ }
  };

  const togglePause = () => {
    if (proctorBlockedRef.current) return;
    if (!isPaused) {
      pausedRef.current = true;
      setIsPaused(true);
      window.speechSynthesis?.pause();
      try { if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.pause(); } catch {}
    } else {
      pausedRef.current = false;
      setIsPaused(false);
      window.speechSynthesis?.resume();
      try {
        if (mediaRecorderRef.current?.state === "paused") mediaRecorderRef.current.resume();
        else if (!isSpeaking) startRecording();
      } catch {}
    }
  };

  const abandonPractice = async () => {
    if (!window.confirm("End this practice session without receiving a score? This will not start the five-hour cooldown.")) return;
    finishingRef.current = true;
    window.speechSynthesis?.cancel();
    try { if (mediaRecorderRef.current?.state !== "inactive") await stopAndTranscribe(currentIndexRef.current); } catch {}
    if (sessionIdRef.current) { try { await api.post(`/speaking/${sessionIdRef.current}/abandon`); } catch {} }
    sessionIdRef.current = null;
    stopTracks();
    await exitFullscreen();
    setScreen("setup");
    setIsPaused(false);
    finishingRef.current = false;
    await refreshAvailability();
  };

  const releaseExistingSession = async () => {
    const activeId = availability.active_session?.id;
    if (!activeId) return;
    if (!window.confirm("Release the active speaking session? Do this only if that test is no longer running. It will not start the five-hour cooldown.")) return;
    try {
      await api.post(`/speaking/${activeId}/abandon`);
      setMicError("");
      await refreshAvailability();
    } catch (error) {
      setMicError(getErrorMessage(error, "Could not release the active session."));
    }
  };

  const restart = () => {
    setScreen("setup");
    setPromptsList([]);
    promptsRef.current = [];
    answersRef.current = {};
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setTranscript("");
    setResults(null);
    setIsPaused(false);
    pausedRef.current = false;
    proctorBlockedRef.current = false;
    pendingProctorTerminationRef.current = null;
    setProctorWarning(null);
    setCameraWarningCount(0);
    setTabWarningCount(0);
    setTotalWarningCount(0);
    totalWarningsRef.current = 0;
    setTerminationReason(null);
    setMicError("");
    finishingRef.current = false;
    refreshAvailability();
  };

  if (screen === "setup") {
    const lockedByCooldown = !availability.loading && availability.reason === "cooldown";
    const activeSession = !availability.loading && availability.reason === "active_session";
    return (
      <Navbar1>
        <main className="app-content speaking-content">
          <section className="speaking-page">
            <div className="speaking-heading"><div><span className="section-kicker">SPEAKING PRACTICE</span><h1>Improve the Way You Speak</h1><p>Practice HR interview answers with real speech transcription, local face detection, measured delivery metrics, and AI feedback.</p></div></div>
            <div className="speaking-setup-grid">
              <div className="speaking-setup-card">
                <div className="speaking-card-header"><div className="speaking-card-icon"><MessageCircle size={22} /></div><div><h2>Practice Configuration</h2><p>Choose your HR round and question difficulty.</p></div></div>
                <div className="speaking-fields">
                  <label><span>Practice Mode</span><select value={mode} onChange={(event) => setMode(event.target.value)}><option value="general">General HR Round</option><option value="behavioral">Behavioral HR Round</option><option value="situational">Situational HR Round</option></select></label>
                  <label><span>Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
                  <label className="speaking-question-count-field"><span>Number of Questions</span><select value={promptCount} onChange={(event) => setPromptCount(Number(event.target.value))}><option value={2}>2 Questions · 4 Minutes</option><option value={3}>3 Questions · 6 Minutes</option><option value={4}>4 Questions · 8 Minutes</option><option value={5}>5 Questions · 10 Minutes</option><option value={6}>6 Questions · 12 Minutes</option></select></label>
                </div>
                <p className="speaking-time-note">Each question has up to 2 minutes. Your overall timer continues across questions. Transcription and AI evaluation run through the backend after each answer and at the end.</p>
                <p className="speaking-time-note speaking-cooldown-note"><ShieldCheck size={17} />One completed speaking test per user every 5 hours. This limit is enforced by PostgreSQL, not browser storage.</p>
                {availability.loading && <p className="speaking-inline-status">Checking your test availability…</p>}
                {lockedByCooldown && <div className="speaking-lock-warning"><Clock3 size={18} /><div><strong>Speaking test temporarily locked</strong><p>Your next test is available at {formatAvailableAt(availability.available_at)}. This cooldown applies to your account on every device.</p></div></div>}
                {activeSession && <div className="speaking-lock-warning"><AlertCircle size={18} /><div><strong>Another session is in progress</strong><p>An active session already exists. If you refreshed or closed the browser during an old test, you can release that session below. Do not release a test that is still running.</p><button type="button" className="release-speaking-session-button" onClick={releaseExistingSession}>Release old session</button></div></div>}
                {micError && <div className="speaking-error speaking-setup-error"><AlertCircle size={17} />{micError}</div>}
                <button className="start-speaking-button" onClick={startPractice} disabled={isStarting || availability.loading || !availability.allowed}><Mic size={20} />{isStarting ? "Preparing camera and microphone…" : lockedByCooldown ? "Test Locked — 5 Hour Cooldown" : activeSession ? "Session Already Active" : "Start Speaking Practice"}</button>
              </div>
              <div className="speaking-preview-card"><div className="speaking-preview"><div className="preview-ai-circle"><Sparkles size={30} /></div><div className="speaking-preview-waves"><span /><span /><span /><span /><span /><span /><span /></div></div><h2>Voice-First Practice</h2><p>Your microphone audio is sent for transcription. Gemini evaluates the transcript and measured delivery data. Face landmarks are processed in your browser.</p><div className="speaking-features"><div><Mic size={18} /><span>speech-to-text</span></div><div><Brain size={18} /><span>Gemini answer evaluation</span></div><div><Gauge size={18} /><span>Word timing, fillers and pauses</span></div><div><ScanFace size={18} /><span>Local MediaPipe face detection</span></div></div></div>
            </div>
          </section>
        </main>
      </Navbar1>
    );
  }

  if (screen === "practice" && currentPrompt) {
    const completed = promptsList.filter((item) => item.completed).length;
    const progress = ((currentIndex + 1) / promptsList.length) * 100;
    return (
      <main className="locked-speaking">
        <div className="speaking-topbar"><div className="speaking-brand"><div className="speaking-brand-icon"><Sparkles size={18} /></div><span>AI Speaking Practice</span></div><div className="speaking-session-status"><ShieldCheck size={16} /> Practice session active</div></div>
        {proctorWarning && <div className={`proctor-warning-banner ${proctorWarning.final ? "proctor-warning-final" : ""}`} role="alert" aria-live="assertive">
          <div className="proctor-warning-copy"><AlertCircle size={23} /><div><strong>{proctorWarning.type === "camera" ? "Camera warning" : "Tab-switch warning"} · Total warnings {proctorWarning.count}/3</strong><p>{proctorWarning.message}</p><small>Combined total: {totalWarningCount}/3 · Camera: {cameraWarningCount} · Tab switches: {tabWarningCount}</small></div></div>
          {proctorWarning.final
            ? <div className="proctor-warning-final-actions"><span className="proctor-warning-ending">Ending test…</span>{micError && !isEvaluating && <button type="button" onClick={() => finishPractice(false, "warning_limit")}>Retry Finalization</button>}</div>
            : <button type="button" onClick={acknowledgeProctorWarning} disabled={!faceStatsRef.current.detector_ready || faceStatsRef.current.last_face_count !== 1 || document.visibilityState === "hidden" || isEvaluating}>Continue Test</button>}
        </div>}
        <div className="speaking-session-bar"><div><span>Question {currentIndex + 1} of {promptsList.length}</span><div className="speaking-progress-track"><div className="speaking-progress-fill" style={{ width: `${progress}%` }} /></div></div><div className="speaking-timer"><Clock3 size={16} />{formatTime(remainingSeconds)}</div></div>
        <section className="speaking-practice-card">
          <div className="practice-mode-label">{modeLabels[mode]} · {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</div>
          <p className="speaking-question-note">Question time: {formatTime(questionRemaining)} remaining · Total session time: {formatTime(remainingSeconds)}</p>
          <div className="speaking-camera-box"><video ref={videoRef} autoPlay muted playsInline aria-label="Camera preview" />{cameraError && <span className="camera-error">{cameraError}</span>}<div className={`face-detection-badge ${faceStatsRef.current.last_face_detected ? "face-found" : ""}`}><ScanFace size={15} />{faceStatus}</div></div>
          <div className="speaking-status">{isEvaluating ? "AI is evaluating your answers…" : isProcessingAnswer ? "Transcribing your answer…" : isSpeaking ? "AI is reading the question…" : isListening ? "Recording your answer…" : isPaused ? "Practice paused" : "Microphone ready"}</div>
          <div className="speaking-prompt"><span>YOUR SPEAKING PROMPT</span><h1>{currentPrompt.prompt}</h1><div className="prompt-actions"><button className="hear-prompt-button" onClick={() => askPrompt(currentPrompt.prompt)} disabled={isSpeaking || isPaused || isListening || isProcessingAnswer}><Volume2 size={17} />Hear Prompt</button></div></div>
          <div className="speaking-listening-panel"><div className={`listening-indicator ${isListening ? "active" : ""}`}><div className={isListening ? "active-mic" : "inactive-mic"}>{isListening ? <Mic size={23} /> : <MicOff size={21} />}</div><div><strong>{isListening ? "Recording…" : isProcessingAnswer ? "Transcribing…" : isSpeaking ? "AI is speaking…" : "Microphone ready"}</strong><p>{isListening ? "Speak naturally. Your audio is being recorded securely for transcription." : "Your answer is transcribed when you continue to the next question."}</p></div></div>
            {micError && <div className="speaking-error"><AlertCircle size={17} />{micError}</div>}
          </div>
          <div className="speaking-controls"><button className="pause-speaking-button" onClick={togglePause} disabled={isProcessingAnswer || isEvaluating || proctorBlockedRef.current}>{isPaused ? <Play size={18} /> : <Pause size={18} />}{isPaused ? "Resume" : "Pause"}</button><button className="retry-speaking-button" onClick={retryPrompt} disabled={isSpeaking || isPaused || isProcessingAnswer || isEvaluating || proctorBlockedRef.current}><RotateCcw size={17} />Retry Answer</button><button className="next-speaking-button" onClick={nextPrompt} disabled={isSpeaking || isPaused || isProcessingAnswer || isEvaluating || proctorBlockedRef.current}>{currentIndex === promptsList.length - 1 ? "Finish & Get Score" : "Submit & Next"}<ArrowRight size={18} /></button></div>
          <button className="end-speaking-button" onClick={abandonPractice} disabled={isEvaluating || proctorBlockedRef.current}><Square size={13} />End Without Score</button>
        </section>
        <div className="speaking-footer"><span>{completed} answers transcribed</span><span>Face landmarks are processed locally. Only audio is sent for transcription.</span></div>
      </main>
    );
  }

  if (screen === "results" && results) {
    const metrics = results.metrics || {};
    const metricItems = [["Fluency", metrics.fluency], ["Answer relevance", metrics.relevance], ["Clarity", metrics.clarity], ["Grammar", metrics.grammar], ["Vocabulary", metrics.vocabulary], ["Answer structure", metrics.structure]];
    return (
      <Navbar1><main className="app-content speaking-content"><section className="speaking-results-page"><div className="speaking-result-icon"><Award size={37} /></div><span className="section-kicker">PRACTICE COMPLETED</span><h1>Your Speaking Practice Results</h1><p className="speaking-results-description">{results.summary || "Your answers have been evaluated using the recorded transcript and measured delivery metrics."}</p>
        <div className="speaking-overview"><div><span>Overall Score</span><strong>{results.overall_score ?? 0}/100</strong></div><div><span>Answered</span><strong>{results.answered}/{results.total}</strong></div><div><span>Words / Minute</span><strong>{results.words_per_minute ?? 0}</strong></div><div><span>Filler Words</span><strong>{results.filler_words ?? 0}</strong></div></div>
        <div className="speaking-metrics-card"><div className="results-card-title"><div className="results-title-icon"><Gauge size={19} /></div><div><h2>Speaking Analysis</h2><p>Gemini feedback and audio-timing measurements</p></div></div><div className="metric-grid">{metricItems.map(([label, value]) => <div className="speaking-metric" key={label}><div><span>{label}</span><strong>{Number(value ?? 0)}%</strong></div><div className="metric-track"><div style={{ width: `${Math.max(0, Math.min(100, Number(value ?? 0)))}%` }} /></div></div>)}</div><p className="speaking-results-description speaking-metric-note">Measured pauses: {results.pause_count ?? 0} · Average pause: {results.average_pause_seconds ?? 0}s. Transcript-only analysis cannot reliably score pronunciation.</p></div>
        {(results.answers || []).length > 0 && <div className="speaking-metrics-card speaking-answer-feedback"><div className="results-card-title"><div className="results-title-icon"><MessageCircle size={19} /></div><div><h2>Your Transcribed Answers</h2><p>Your recorded answers, available only after finishing the test</p></div></div>{results.answers.map((answer) => <div className="speaking-answer-feedback-item" key={answer.question_index}><strong>Question {answer.question_index}: {answer.question}</strong><p>{answer.transcript || "No transcript was captured for this answer."}</p></div>)}</div>}
        {results.termination_reason && <div className="speaking-termination-note"><AlertCircle size={21} /><div><strong>Test ended automatically</strong><p>{results.completion_note || (results.termination_reason === "camera" ? "The test reached three camera warnings." : "The test reached three tab-switch warnings.")} Only answers transcribed before termination were included in this result.</p><small>Total warnings: {results.warning_count ?? totalWarningCount}/3 · Camera: {results.camera_warnings ?? cameraWarningCount} · Tab switches: {results.tab_switch_warnings ?? tabWarningCount}</small></div></div>}
        {results.face_monitoring_note && <div className={`speaking-camera-penalty-note ${Number(results.camera_penalty ?? 0) > 0 ? "has-penalty" : ""}`}><AlertCircle size={22} /><div><strong>Camera monitoring {Number(results.camera_penalty ?? 0) > 0 ? "penalty" : "summary"}</strong><p>{results.face_monitoring_note}</p></div>{Number(results.camera_penalty ?? 0) > 0 && <span className="camera-penalty-points">−{results.camera_penalty} points</span>}</div>}
        <div className="speaking-feedback-grid"><div className="feedback-card"><CheckCircle2 size={20} /><div><h3>Strengths</h3>{(results.strengths || []).length ? <ul>{results.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>No strengths were returned for this session.</p>}</div></div><div className="feedback-card improvement"><Brain size={20} /><div><h3>Areas to Improve</h3>{(results.improvements || []).length ? <ul>{results.improvements.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>Continue practicing concise, structured answers.</p>}</div></div></div>
        {(results.answer_feedback || []).length > 0 && <div className="speaking-metrics-card speaking-answer-feedback"><div className="results-card-title"><div className="results-title-icon"><MessageCircle size={19} /></div><div><h2>Question-by-question feedback</h2><p>Specific suggestions for each response</p></div></div>{results.answer_feedback.map((item) => <div className="speaking-answer-feedback-item" key={item.question_index}><strong>Question {item.question_index}</strong><p>{item.feedback}</p>{item.suggested_structure && <p><b>Try this structure:</b> {item.suggested_structure}</p>}</div>)}</div>}
        <div className="ai-speaking-feedback"><div className="ai-feedback-icon"><Sparkles size={24} /></div><div><h2>AI Speaking Coach</h2><p>Evaluation provider: {results.evaluation_provider || "Gemini"}. Face detection checks only whether a face was visible; it is not used to infer emotion, confidence, or personality. Your next test is subject to the five-hour account cooldown.</p></div></div>
        <div className="speaking-result-actions"><button className="secondary-speaking-result" onClick={restart}><RotateCcw size={18} />Back to Speaking Practice</button><button className="primary-speaking-result" onClick={() => navigate("/dashboard")}><LayoutDashboard size={18} />Go to Dashboard</button></div>
      </section></main></Navbar1>
    );
  }
  return null;
}
