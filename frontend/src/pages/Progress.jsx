import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  Clock3,
  Flame,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  Mic,
  Code2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import Navbar1 from "../components/Navbar1";

import {
  getProgressSummary,
  getSpeakingProgressSummary,
  getInterviewProgressSummary,
} from "../services/progressService";

import "../styles/progress.css";


const number = (
  value,
  fallback = 0
) => {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
};


const getDate = (item) =>
  item?.createdAt ||
  item?.created_at ||
  item?.completedAt ||
  item?.timestamp ||
  item?.date ||
  null;


const normalizeHistory = (
  items = []
) =>
  items.map((item) => ({
    ...item,

    wpm: number(item.wpm),

    rawWpm: number(
      item.rawWpm ??
        item.raw_wpm
    ),

    accuracy: number(
      item.accuracy
    ),

    errors: number(
      item.errors
    ),

    correct: number(
      item.correct ??
        item.correct_characters
    ),

    characters: number(
      item.characters
    ),

    createdAt: getDate(item),
  }));


const Progress = () => {

  const navigate = useNavigate();

  const [period, setPeriod] =
    useState("30 Days");

  const [practiceType, setPracticeType] =
    useState("typing");

  const [practiceOpen, setPracticeOpen] =
    useState(false);

  const [periodOpen, setPeriodOpen] =
    useState(false);

  const [history, setHistory] =
    useState([]);

  const [summary, setSummary] =
    useState({
      sessions: 0,
      currentWpm: 0,
      currentRawWpm: 0,
      currentAccuracy: 0,
      currentErrors: 0,
      bestWpm: 0,
      bestAccuracy: 0,
      streak: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    let active = true;


    const loadProgress =
      async () => {

        setLoading(true);
        setError("");


        try {

          const response =
            await (practiceType === "speaking"
              ? getSpeakingProgressSummary(period)
              : practiceType === "interview"
              ? getInterviewProgressSummary(period)
              : getProgressSummary(period));


          if (!active) {
            return;
          }


          setHistory(
            normalizeHistory(
              response?.history || []
            )
          );


          setSummary({
            sessions:
              number(
                response?.summary?.sessions
              ),

            currentWpm:
              number(
                response?.summary
                  ?.currentWpm ??
                response?.summary
                  ?.current_wpm
              ),

            currentRawWpm:
              number(
                response?.summary
                  ?.currentRawWpm ??
                response?.summary
                  ?.current_raw_wpm
              ),

            currentAccuracy:
              number(
                response?.summary
                  ?.currentAccuracy ??
                response?.summary
                  ?.current_accuracy
              ),

            currentErrors:
              number(
                response?.summary
                  ?.currentErrors ??
                response?.summary
                  ?.current_errors
              ),

            bestWpm:
              number(
                response?.summary
                  ?.bestWpm ??
                response?.summary
                  ?.best_wpm
              ),

            bestAccuracy:
              number(
                response?.summary
                  ?.bestAccuracy ??
                response?.summary
                  ?.best_accuracy
              ),

            streak:
              number(response?.summary?.streak),

            currentScore: number(response?.summary?.currentScore),
            bestScore: number(response?.summary?.bestScore),
            averageScore: number(response?.summary?.averageScore),
            currentMode: response?.summary?.currentMode || "",
            currentDifficulty: response?.summary?.currentDifficulty || "",
            currentDuration: number(response?.summary?.currentDuration),
          });

        } catch (requestError) {

          console.error(
            "Failed to load progress:",
            requestError
          );


          if (!active) {
            return;
          }


          setHistory([]);

          setSummary({
            sessions: 0,
            currentWpm: 0,
            currentRawWpm: 0,
            currentAccuracy: 0,
            currentErrors: 0,
            bestWpm: 0,
            bestAccuracy: 0,
            streak: 0,
            currentScore: 0, bestScore: 0, averageScore: 0,
            currentMode: "", currentDifficulty: "", currentDuration: 0,
          });


          setError(
            requestError
              ?.response
              ?.data
              ?.detail ||
            "Unable to load your progress right now."
          );

        } finally {

          if (active) {
            setLoading(false);
          }

        }
      };


    loadProgress();


    return () => {
      active = false;
    };

  }, [period, practiceType]);


  const hasData =
    history.length > 0;


  const chartHistory =
    useMemo(
      () =>
        [...history]
          .slice(0, 8)
          .reverse(),
      [history]
    );


  const stats = practiceType === "speaking"
    ? [
        ["Latest Score", summary.currentScore, "%"],
        ["Best Score", summary.bestScore, "%"],
        ["Average Score", summary.averageScore, "%"],
        ["Latest Duration", summary.currentDuration ? Math.round(summary.currentDuration) : 0, " sec"],
      ]
    : practiceType === "interview"
    ? [
        ["Latest Interview Score", summary.currentScore, "%"],
        ["Best Interview Score", summary.bestScore, "%"],
        ["Average Interview Score", summary.averageScore, "%"],
        ["Latest Duration", summary.currentDuration ? Math.round(summary.currentDuration / 60) : 0, " min"],
      ]
    : [
        ["Current WPM", summary.currentWpm, " WPM"],
        ["Accuracy", summary.currentAccuracy, "%"],
        ["Raw WPM", summary.currentRawWpm, " WPM"],
        ["Errors", summary.currentErrors, ""],
      ];


  const periodOptions = [
    "7 Days",
    "30 Days",
    "90 Days",
    "All Time",
  ];


  return (
    <Navbar1>

      <main className="app-content progress-content">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="progress-header">

          <div>

            <span className="progress-eyebrow">
              PERFORMANCE CENTER
            </span>

            <h1>
              Your Progress
            </h1>

            <p>
              {practiceType === "speaking"
                ? "Track your speaking scores, feedback and improvement across completed sessions."
                : practiceType === "interview"
                ? "Track your interview scores, question performance and improvement across completed interviews."
                : "Track your typing speed, accuracy and improvement across your completed practice sessions."}
            </p>

          </div>


          <div className="progress-controls">

            <span className="control-label">
              Practice
            </span>


            <div className="practice-selector">

              <button
                type="button"
                className="practice-selector-button"
                onClick={() =>
                  setPracticeOpen(
                    (value) => !value
                  )
                }
              >

                {practiceType === "speaking" ? <Mic size={17} /> : practiceType === "interview" ? <Code2 size={17} /> : <Zap size={17} />}

                <span>
                  {practiceType === "speaking" ? "Speaking Practice" : practiceType === "interview" ? "Interview Practice" : "Typing Practice"}
                </span>

                <ChevronDown
                  size={16}
                  className={
                    practiceOpen
                      ? "rotate"
                      : ""
                  }
                />

              </button>


              {practiceOpen && (

                <div className="practice-dropdown">

                  <button
                    type="button"
                    className={practiceType === "typing" ? "selected" : ""}
                    onClick={() => { setPracticeType("typing"); setPracticeOpen(false); }}
                  >
                    <Zap size={16} />
                    <span>Typing Practice</span>
                    {practiceType === "typing" && <Check size={15} />}
                  </button>
                  <button
                    type="button"
                    className={practiceType === "speaking" ? "selected" : ""}
                    onClick={() => { setPracticeType("speaking"); setPracticeOpen(false); }}
                  >
                    <Mic size={16} />
                    <span>Speaking Practice</span>
                    {practiceType === "speaking" && <Check size={15} />}
                  </button>
                  <button
                    type="button"
                    className={practiceType === "interview" ? "selected" : ""}
                    onClick={() => { setPracticeType("interview"); setPracticeOpen(false); }}
                  >
                    <Code2 size={16} />
                    <span>Interview Practice</span>
                    {practiceType === "interview" && <Check size={15} />}
                  </button>

                </div>

              )}

            </div>

          </div>

        </div>


        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (

          <div
            className="progress-panel"
            style={{
              marginBottom: "17px",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>

        )}


        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <section className="progress-summary-grid">

          <div className="progress-stat-card main-score-card">

            <div className="stat-top">

              <span>
                Overall Score
              </span>

              <Target size={19} />

            </div>


            <div className="main-score">

              <strong>

                {loading
                  ? "..."
                  : practiceType === "typing"
                  ? (summary.currentAccuracy ? `${summary.currentAccuracy}%` : "—")
                  : (summary.currentScore ? `${summary.currentScore}%` : "—")}

              </strong>


              <span>

                {hasData
                  ? (practiceType === "speaking" ? "Latest speaking score" : practiceType === "interview" ? "Latest interview score" : "Current typing accuracy")
                  : (practiceType === "speaking" ? "Complete a speaking test to begin" : practiceType === "interview" ? "Complete an interview to begin" : "Complete a typing session to begin")}

              </span>

            </div>

          </div>


          <div className="progress-stat-card">

            <div className="stat-top">

              <span>
                Sessions
              </span>

              <BarChart3 size={19} />

            </div>


            <strong className="big-stat">

              {loading
                ? "..."
                : summary.sessions}

            </strong>


            <span className="stat-helper">

              {hasData
                ? `${practiceType === "speaking" ? "Speaking" : practiceType === "interview" ? "Interview" : "Typing"} sessions recorded`
                : "No sessions yet"}

            </span>


            <div className="stat-bottom">

              <TrendingUp size={15} />

              <span>
                Keep practicing to
                build history
              </span>

            </div>

          </div>


          <div className="progress-stat-card">

            <div className="stat-top">

              <span>
                Current Streak
              </span>

              <Flame size={19} />

            </div>


            <strong className="big-stat">

              {loading
                ? "..."
                : summary.streak}

            </strong>


            <span className="stat-helper">

              {summary.streak === 1
                ? "day"
                : "days"}

            </span>


            <div className="stat-bottom">

              <Flame size={15} />

              <span>
                Practice consistently
              </span>

            </div>

          </div>


          <div className="progress-stat-card">

            <div className="stat-top">

              <span>
                {practiceType === "speaking" ? "Best Speaking Score" : practiceType === "interview" ? "Best Interview Score" : "Best WPM"}
              </span>

              <Trophy size={19} />

            </div>


            <strong className="big-stat">

              {loading
                ? "..."
                : practiceType === "typing"
                ? (summary.bestWpm || "—")
                : (summary.bestScore || "—")}

            </strong>


            <span className="stat-helper">
              {practiceType === "speaking" ? "Best recorded speaking score" : practiceType === "interview" ? "Best recorded interview score" : "Best recorded typing speed"}
            </span>


            <div className="stat-bottom">

              <Trophy size={15} />

              <span>
                Keep pushing your best
              </span>

            </div>

          </div>

        </section>


        {/* =====================================================
            PERFORMANCE CHART
        ===================================================== */}

        <section className="progress-panel performance-panel">

          <div className="panel-heading">

            <div>

              <span className="panel-label">
                {practiceType === "speaking" ? "SPEAKING" : practiceType === "interview" ? "INTERVIEW" : "TYPING"}
              </span>

              <h2>
                {practiceType === "speaking" ? "Speaking Performance Overview" : practiceType === "interview" ? "Interview Performance Overview" : "Performance Overview"}
              </h2>

              <p>
                {practiceType === "speaking"
                  ? "Your speaking scores for the selected period."
                  : practiceType === "interview"
                  ? "Your completed interview scores for the selected period."
                  : "Your typing performance for the selected period."}
              </p>

            </div>


            <div className="period-selector">

              <button
                type="button"
                onClick={() =>
                  setPeriodOpen(
                    (value) => !value
                  )
                }
              >

                {period}

                <ChevronDown size={15} />

              </button>


              {periodOpen && (

                <div className="period-menu">

                  {periodOptions.map(
                    (item) => (

                      <button
                        type="button"
                        key={item}
                        className={
                          period === item
                            ? "active"
                            : ""
                        }
                        onClick={() => {

                          setPeriod(item);

                          setPeriodOpen(
                            false
                          );

                        }}
                      >
                        {item}
                      </button>

                    )
                  )}

                </div>

              )}

            </div>

          </div>


          <div className="performance-chart">

            <div className="chart-y-labels">

              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>

            </div>


            <div className="chart-area">

              <div className="chart-grid-line" />
              <div className="chart-grid-line" />
              <div className="chart-grid-line" />
              <div className="chart-grid-line" />


              {loading ? (

                <div className="chart-empty">

                  <BarChart3 size={32} />

                  <strong>
                    Loading progress...
                  </strong>

                </div>

              ) : chartHistory.length ? (

                <div className="chart-bars">

                  {chartHistory.map(
                    (item, index) => {

                      const score = practiceType === "typing"
                        ? number(item.accuracy)
                        : number(item.overallScore ?? item.score);


                      return (

                        <div
                          className="chart-column"
                          key={`${
                            item.id || index
                          }-${score}`}
                        >

                          <div
                            className="chart-bar"
                            style={{
                              height: `${
                                Math.max(
                                  score,
                                  4
                                )
                              }%`,
                            }}
                          >

                            <span>

                              {score
                                ? `${score}%`
                                : "—"}

                            </span>

                          </div>

                        </div>

                      );

                    }
                  )}

                </div>

              ) : (

                <div className="chart-empty">

                  <BarChart3 size={32} />

                  <strong>
                    {practiceType === "speaking" ? "No speaking history yet" : practiceType === "interview" ? "No interview history yet" : "No typing history yet"}
                  </strong>

                  <span>
                    {practiceType === "speaking"
                      ? "Complete a speaking test to start seeing your performance trend."
                      : practiceType === "interview"
                      ? "Complete an interview to start seeing your performance trend."
                      : "Complete a typing session to start seeing your performance trend."}
                  </span>

                </div>

              )}

            </div>

          </div>

        </section>


        {/* =====================================================
            DETAILED METRICS
        ===================================================== */}

        <section className="progress-panel statistics-panel">

          <div className="panel-heading compact">

            <div>

              <span className="panel-label">
                DETAILED METRICS
              </span>

              <h2>
                {practiceType === "speaking" ? "Speaking Practice Statistics" : practiceType === "interview" ? "Interview Practice Statistics" : "Typing Practice Statistics"}
              </h2>

              <p>
                {practiceType === "speaking"
                  ? "Scores and duration from your latest completed speaking test."
                  : practiceType === "interview"
                  ? "Scores and duration from your latest completed interview."
                  : "Key measurements from your latest recorded session."}
              </p>

            </div>

          </div>


          <div className="detail-stat-grid">

            {stats.map(
              ([label, value, suffix]) => (

                <div
                  className="detail-stat"
                  key={label}
                >

                  <span>
                    {label}
                  </span>

                  <strong>

                    {loading
                      ? "..."
                      : value
                      ? `${value}${suffix || ""}`
                      : "—"}

                  </strong>

                </div>

              )
            )}

          </div>

        </section>


        {/* =====================================================
            INSIGHTS + RECENT SESSIONS
        ===================================================== */}

        <section className="progress-two-column">

          <div className="progress-panel insight-panel">

            <div className="panel-heading compact">

              <div>

                <span className="panel-label">
                  YOUR PERFORMANCE
                </span>

                <h2>
                  What This Means
                </h2>

              </div>

            </div>


            {hasData ? (

              <>

                <div className="insight-block strength">

                  <div className="insight-icon">
                    <Trophy size={18} />
                  </div>


                  <div>

                    <span>
                      {practiceType === "speaking" ? "Best speaking score" : practiceType === "interview" ? "Best interview score" : "Best typing speed"}
                    </span>

                    <strong>
                      {practiceType === "typing" ? `${summary.bestWpm} WPM` : `${summary.bestScore}%`}
                    </strong>

                    <p>
                      {practiceType === "speaking"
                        ? "This is your highest recorded speaking score in the selected period."
                        : practiceType === "interview"
                        ? "This is your highest recorded interview score in the selected period."
                        : "This is your highest recorded typing speed in the selected period."}
                    </p>

                  </div>

                </div>


                <div className="insight-block neutral">

                  <div className="insight-icon">
                    <TrendingUp size={18} />
                  </div>


                  <div>

                    <span>
                      {practiceType === "speaking" ? "Average speaking score" : practiceType === "interview" ? "Average interview score" : "Current accuracy"}
                    </span>

                    <strong>
                      {practiceType === "typing" ? `${summary.currentAccuracy}%` : `${summary.averageScore}%`}
                    </strong>

                    <p>
                      {practiceType === "speaking"
                        ? "Review your feedback and improvement suggestions after each test."
                        : practiceType === "interview"
                        ? "Review question-level feedback and suggested answers after each interview."
                        : "Keep practicing to improve both speed and accuracy together."}
                    </p>

                  </div>

                </div>

              </>

            ) : (

              <div className="insight-empty">

                <div className="insight-icon">
                  <BarChart3 size={19} />
                </div>

                <strong>
                  Your insights will
                  appear here
                </strong>

                <p>
                  {practiceType === "speaking"
                    ? "Complete a speaking test and your scores and feedback will appear here."
                    : practiceType === "interview"
                    ? "Complete an interview and your scorecard will appear here."
                    : "Complete a typing practice session and your performance data will be shown here."}
                </p>

              </div>

            )}

          </div>


          <div className="progress-panel activity-panel">

            <div className="panel-heading compact">

              <div>

                <span className="panel-label">
                  HISTORY
                </span>

                <h2>
                  Recent Sessions
                </h2>

              </div>

            </div>


            {history.length ? (

              <div className="activity-list">

                {history
                  .slice(0, 4)
                  .map(
                    (item, index) => (

                      <div
                        className="activity-row"
                        key={`${
                          item.id || index
                        }-${item.createdAt}`}
                      >

                        <div className="activity-icon">
                          {practiceType === "speaking" ? <Mic size={17} /> : practiceType === "interview" ? <Code2 size={17} /> : <Zap size={17} />}
                        </div>


                        <div className="activity-main">

                          <strong>
                            {practiceType === "speaking"
                              ? `${item.mode || "General"} Speaking Practice (${item.difficulty || "easy"})`
                              : practiceType === "interview"
                              ? `Interview Practice (${item.difficulty || "medium"})`
                              : "Typing Practice session"}
                          </strong>

                          <span>

                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleString()
                              : "Recorded session"}
                            {practiceType === "interview" && ` · ${item.answeredQuestions || 0}/${item.totalQuestions || 0} answered`}

                          </span>

                        </div>


                        <div className="activity-score">

                          <strong>

                            {practiceType === "typing"
                              ? (item.accuracy ? `${item.accuracy}%` : "—")
                              : ((item.overallScore ?? item.score) != null ? `${item.overallScore ?? item.score}%` : "—")}

                          </strong>

                        </div>


                        <ArrowUpRight
                          size={16}
                          className="activity-arrow"
                        />

                      </div>

                    )
                  )}

              </div>

            ) : (

              <div className="activity-empty">

                <div className="empty-icon">
                  <Clock3 size={21} />
                </div>

                <strong>
                  No sessions yet
                </strong>

                <span>
                  {practiceType === "speaking"
                    ? "Your completed speaking tests will appear here."
                    : practiceType === "interview"
                    ? "Your completed interviews will appear here."
                    : "Your completed typing sessions will appear here."}
                </span>

              </div>

            )}

          </div>

        </section>


        {/* =====================================================
            NEXT STEP
        ===================================================== */}

        <section className="recommendation-card">

          <div className="recommendation-icon">
            <Zap size={21} />
          </div>


          <div className="recommendation-content">

            <span>
              NEXT STEP
            </span>

            <h2>
              {practiceType === "speaking" ? "Continue your speaking practice" : practiceType === "interview" ? "Continue your interview practice" : "Continue your typing practice"}
            </h2>

            <p>
              {practiceType === "speaking"
                ? "Keep reviewing your scores, strengths and improvement suggestions after each completed test."
                : practiceType === "interview"
                ? "Review your scorecards and question-level feedback to improve your next interview."
                : "Keep completing sessions to build a reliable performance history."}
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate(practiceType === "speaking" ? "/speaking" : practiceType === "interview" ? "/interview" : "/typing")
            }
          >

            Practice Now

            <ArrowUpRight size={16} />

          </button>

        </section>

      </main>

    </Navbar1>
  );
};


export default Progress;