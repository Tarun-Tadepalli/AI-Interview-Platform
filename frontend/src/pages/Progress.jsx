import React, { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronDown,
  Clock3,
  Flame,
  MessageSquareText,
  Mic2,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import Navbar1 from "../components/Navbar1";
import "../styles/progress.css";

const readStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

const number = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getDate = (item) =>
  item?.completedAt ||
  item?.createdAt ||
  item?.timestamp ||
  item?.date ||
  null;

const getHistory = (historyKey, resultKey) => {
  const history = readStorage(historyKey);
  const result = readStorage(resultKey);

  if (Array.isArray(history) && history.length) return history;
  if (Array.isArray(result?.history) && result.history.length) {
    return result.history;
  }
  return result ? [result] : [];
};

const calculateStreak = (items) => {
  const dates = [
    ...new Set(
      items
        .map(getDate)
        .filter(Boolean)
        .map((date) => new Date(date).toISOString().slice(0, 10))
    ),
  ]
    .sort()
    .reverse();

  if (!dates.length) return 0;

  let streak = 1;

  for (let i = 0; i < dates.length - 1; i += 1) {
    const current = new Date(dates[i]);
    const previous = new Date(dates[i + 1]);
    const difference =
      (current - previous) / (1000 * 60 * 60 * 24);

    if (difference <= 1) streak += 1;
    else break;
  }

  return streak;
};

const Progress = () => {
  const [practice, setPractice] = useState("interview");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [period, setPeriod] = useState("30 Days");
  const [periodOpen, setPeriodOpen] = useState(false);

  const interviewHistory = getHistory(
    "aiInterviewHistory",
    "aiInterviewResult"
  );

  const speakingHistory = getHistory(
    "aiSpeakingPracticeHistory",
    "aiSpeakingPracticeResult"
  );

  const typingHistory = getHistory(
    "aiTypingPracticeHistory",
    "aiTypingPracticeResult"
  );

  const data = useMemo(() => {
    if (practice === "speaking") {
      const current = speakingHistory[0] || {};

      const scores = speakingHistory
        .map((item) =>
          number(
            item.overallScore ||
              item.score ||
              item.fluency
          )
        )
        .filter((score) => score > 0);

      return {
        name: "Speaking Practice",
        shortName: "Speaking",
        icon: Mic2,
        history: speakingHistory,
        sessions: speakingHistory.length,
        streak: calculateStreak(speakingHistory),
        overall: number(
          current.overallScore ||
            current.score ||
            current.fluency
        ),
        highest: scores.length ? Math.max(...scores) : 0,
        stats: [
          ["Fluency", number(current.fluency)],
          ["Pronunciation", number(current.pronunciation)],
          ["Grammar", number(current.grammar)],
          ["Vocabulary", number(current.vocabulary)],
        ],
        current,
      };
    }

    if (practice === "typing") {
      const current = typingHistory[0] || {};

      const wpmValues = typingHistory
        .map((item) => number(item.wpm))
        .filter((value) => value > 0);

      const accuracyValues = typingHistory
        .map((item) => number(item.accuracy))
        .filter((value) => value > 0);

      return {
        name: "Typing Practice",
        shortName: "Typing",
        icon: Zap,
        history: typingHistory,
        sessions: typingHistory.length,
        streak: calculateStreak(typingHistory),
        overall: number(current.accuracy),
        highest: accuracyValues.length
          ? Math.max(...accuracyValues)
          : 0,
        bestWpm: wpmValues.length ? Math.max(...wpmValues) : 0,
        stats: [
          ["Current WPM", number(current.wpm), "WPM"],
          ["Accuracy", number(current.accuracy), "%"],
          ["Raw WPM", number(current.rawWpm), "WPM"],
          ["Errors", number(current.errors), ""],
        ],
        current,
      };
    }

    const current = interviewHistory[0] || {};

    const scores = interviewHistory
      .map((item) =>
        number(
          item.overallScore ||
            item.score ||
            item.averageScore
        )
      )
      .filter((score) => score > 0);

    return {
      name: "AI Interview",
      shortName: "Interview",
      icon: MessageSquareText,
      history: interviewHistory,
      sessions: interviewHistory.length,
      streak: calculateStreak(interviewHistory),
      overall: number(
        current.overallScore ||
          current.score ||
          current.averageScore
      ),
      highest: scores.length ? Math.max(...scores) : 0,
      stats: [
        [
          "Average Score",
          number(
            current.averageScore ||
              current.overallScore ||
              current.score
          ),
          "%",
        ],
        [
          "Highest Score",
          scores.length ? Math.max(...scores) : 0,
          "%",
        ],
        [
          "Questions Answered",
          number(
            current.questionsAnswered ||
              current.answeredQuestions
          ),
          "",
        ],
        [
          "Skipped",
          number(
            current.skipped ||
              current.skippedQuestions
          ),
          "",
        ],
      ],
      current,
    };
  }, [practice, interviewHistory, speakingHistory, typingHistory]);

  const practiceOptions = [
    {
      id: "interview",
      label: "Interview",
      icon: MessageSquareText,
    },
    {
      id: "speaking",
      label: "Speaking Practice",
      icon: Mic2,
    },
    {
      id: "typing",
      label: "Typing Practice",
      icon: Zap,
    },
  ];

  const selectedOption = practiceOptions.find(
    (item) => item.id === practice
  );

  const hasData = data.sessions > 0;

  return (
    <Navbar1>
      <main className="app-content progress-content">
        <div className="progress-header">
          <div>
            <span className="progress-eyebrow">
              PERFORMANCE CENTER
            </span>

            <h1>Your Progress</h1>

            <p>
              Track your improvement and understand your
              performance across each practice area.
            </p>
          </div>

          <div className="progress-controls">
            <span className="control-label">Practice</span>

            <div className="practice-selector">
              <button
                type="button"
                className="practice-selector-button"
                onClick={() =>
                  setDropdownOpen((value) => !value)
                }
              >
                {selectedOption && (
                  <selectedOption.icon size={17} />
                )}

                <span>{selectedOption?.label}</span>

                <ChevronDown
                  size={16}
                  className={dropdownOpen ? "rotate" : ""}
                />
              </button>

              {dropdownOpen && (
                <div className="practice-dropdown">
                  {practiceOptions.map((option) => {
                    const Icon = option.icon;

                    return (
                      <button
                        type="button"
                        key={option.id}
                        className={
                          practice === option.id
                            ? "selected"
                            : ""
                        }
                        onClick={() => {
                          setPractice(option.id);
                          setDropdownOpen(false);
                        }}
                      >
                        <Icon size={16} />
                        <span>{option.label}</span>

                        {practice === option.id && (
                          <Check size={15} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="progress-summary-grid">
          <div className="progress-stat-card main-score-card">
            <div className="stat-top">
              <span>Overall Score</span>
              <Target size={19} />
            </div>

            <div className="main-score">
              <strong>
                {data.overall ? `${data.overall}%` : "—"}
              </strong>

              <span>
                {hasData
                  ? `Current ${data.shortName.toLowerCase()} performance`
                  : `Complete a ${data.shortName.toLowerCase()} session to begin`}
              </span>
            </div>
          </div>

          <div className="progress-stat-card">
            <div className="stat-top">
              <span>Sessions</span>
              <BarChart3 size={19} />
            </div>

            <strong className="big-stat">
              {data.sessions}
            </strong>

            <span className="stat-helper">
              {hasData
                ? `${data.shortName} sessions recorded`
                : "No sessions yet"}
            </span>

            <div className="stat-bottom">
              <TrendingUp size={15} />
              <span>Keep practicing to build history</span>
            </div>
          </div>

          <div className="progress-stat-card">
            <div className="stat-top">
              <span>Current Streak</span>
              <Flame size={19} />
            </div>

            <strong className="big-stat">
              {data.streak}
            </strong>

            <span className="stat-helper">
              {data.streak === 1 ? "day" : "days"}
            </span>

            <div className="stat-bottom">
              <Flame size={15} />
              <span>Practice consistently</span>
            </div>
          </div>

          <div className="progress-stat-card">
            <div className="stat-top">
              <span>Highest Score</span>
              <Trophy size={19} />
            </div>

            <strong className="big-stat">
              {data.highest ? `${data.highest}%` : "—"}
            </strong>

            <span className="stat-helper">
              Best recorded performance
            </span>

            <div className="stat-bottom">
              <Trophy size={15} />
              <span>Keep pushing your best</span>
            </div>
          </div>
        </section>

        <section className="progress-panel performance-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">
                {data.shortName.toUpperCase()}
              </span>

              <h2>Performance Overview</h2>

              <p>
                Your {data.shortName.toLowerCase()} performance
                for the selected period.
              </p>
            </div>

            <div className="period-selector">
              <button
                type="button"
                onClick={() =>
                  setPeriodOpen((value) => !value)
                }
              >
                {period}
                <ChevronDown size={15} />
              </button>

              {periodOpen && (
                <div className="period-menu">
                  {[
                    "7 Days",
                    "30 Days",
                    "90 Days",
                    "All Time",
                  ].map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={
                        period === item ? "active" : ""
                      }
                      onClick={() => {
                        setPeriod(item);
                        setPeriodOpen(false);
                      }}
                    >
                      {item}
                    </button>
                  ))}
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

              {data.history.length ? (
                <div className="chart-bars">
                  {data.history
                    .slice(0, 8)
                    .reverse()
                    .map((item, index) => {
                      const score = number(
                        item.overallScore ||
                          item.score ||
                          item.averageScore ||
                          item.accuracy ||
                          item.fluency
                      );

                      return (
                        <div
                          className="chart-column"
                          key={`${index}-${score}`}
                        >
                          <div
                            className="chart-bar"
                            style={{
                              height: `${Math.max(
                                score,
                                4
                              )}%`,
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
                    })}
                </div>
              ) : (
                <div className="chart-empty">
                  <BarChart3 size={32} />

                  <strong>
                    No {data.shortName.toLowerCase()} history yet
                  </strong>

                  <span>
                    Complete your first{" "}
                    {data.shortName.toLowerCase()} session
                    to start seeing your performance trend.
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="progress-panel statistics-panel">
          <div className="panel-heading compact">
            <div>
              <span className="panel-label">
                DETAILED METRICS
              </span>

              <h2>
                {data.name} Statistics
              </h2>

              <p>
                Key measurements from your latest recorded
                session.
              </p>
            </div>
          </div>

          <div className="detail-stat-grid">
            {data.stats.map(([label, value, suffix]) => (
              <div className="detail-stat" key={label}>
                <span>{label}</span>

                <strong>
                  {value
                    ? `${value}${suffix || ""}`
                    : "—"}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section className="progress-two-column">
          <div className="progress-panel insight-panel">
            <div className="panel-heading compact">
              <div>
                <span className="panel-label">
                  YOUR PERFORMANCE
                </span>

                <h2>What This Means</h2>
              </div>
            </div>

            {hasData ? (
              <>
                <div className="insight-block strength">
                  <div className="insight-icon">
                    <Trophy size={18} />
                  </div>

                  <div>
                    <span>Best recorded score</span>

                    <strong>
                      {data.highest}%
                    </strong>

                    <p>
                      This is your highest recorded
                      {` ${data.shortName.toLowerCase()}`}
                      performance so far.
                    </p>
                  </div>
                </div>

                <div className="insight-block neutral">
                  <div className="insight-icon">
                    <TrendingUp size={18} />
                  </div>

                  <div>
                    <span>Keep improving</span>

                    <strong>
                      {data.sessions} session
                      {data.sessions === 1 ? "" : "s"} completed
                    </strong>

                    <p>
                      More sessions will give the platform
                      enough data to identify improvement
                      trends accurately.
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
                  Your insights will appear here
                </strong>

                <p>
                  Complete a {data.shortName.toLowerCase()}
                  practice session and your performance
                  data will be shown here.
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

                <h2>Recent Sessions</h2>
              </div>
            </div>

            {data.history.length ? (
              <div className="activity-list">
                {data.history
                  .slice(0, 4)
                  .map((item, index) => {
                    const score = number(
                      item.overallScore ||
                        item.score ||
                        item.averageScore ||
                        item.accuracy ||
                        item.fluency
                    );

                    return (
                      <div
                        className="activity-row"
                        key={index}
                      >
                        <div className="activity-icon">
                          <data.icon size={17} />
                        </div>

                        <div className="activity-main">
                          <strong>
                            {data.name} session
                          </strong>

                          <span>
                            {getDate(item)
                              ? new Date(
                                  getDate(item)
                                ).toLocaleDateString()
                              : "Recorded session"}
                          </span>
                        </div>

                        <div className="activity-score">
                          <strong>
                            {score ? `${score}%` : "—"}
                          </strong>
                        </div>

                        <ArrowUpRight
                          size={16}
                          className="activity-arrow"
                        />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="activity-empty">
                <div className="empty-icon">
                  <Clock3 size={21} />
                </div>

                <strong>No sessions yet</strong>

                <span>
                  Your completed{" "}
                  {data.shortName.toLowerCase()} sessions
                  will appear here.
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="recommendation-card">
          <div className="recommendation-icon">
            {React.createElement(data.icon, { size: 21 })}
          </div>

          <div className="recommendation-content">
            <span>NEXT STEP</span>

            <h2>
              Continue your {data.shortName.toLowerCase()}
              practice
            </h2>

            <p>
              Keep completing sessions to build a reliable
              performance history and identify meaningful
              improvement trends.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const path =
                practice === "interview"
                  ? "/interview"
                  : practice === "speaking"
                  ? "/speaking"
                  : "/typing";

              window.location.href = path;
            }}
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