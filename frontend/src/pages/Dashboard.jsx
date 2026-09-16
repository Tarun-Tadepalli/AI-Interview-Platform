import React from "react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Flame,
  Mic2,
  Play,
  Target,
  TrendingUp,
  Keyboard,
  BrainCircuit,
  Sparkles,
} from "lucide-react";

import Navbar1 from "../components/Navbar1";
import "../styles/dashboard.css";

const stats = [
  {
    title: "Interviews Completed",
    value: "12",
    change: "+3 this month",
    icon: BriefcaseBusiness,
    className: "stat-red",
  },
  {
    title: "Average Score",
    value: "78%",
    change: "+8% improvement",
    icon: TrendingUp,
    className: "stat-purple",
  },
  {
    title: "Speaking Score",
    value: "82%",
    change: "+5% this month",
    icon: Mic2,
    className: "stat-blue",
  },
  {
    title: "Typing Speed",
    value: "54",
    suffix: " WPM",
    change: "+7 WPM",
    icon: Keyboard,
    className: "stat-orange",
  },
];

const practiceCards = [
  {
    title: "Technical Interview",
    description:
      "Test your technical knowledge with role-focused interview questions.",
    icon: BriefcaseBusiness,
    className: "practice-red",
    action: "Start Interview",
    path: "/interview",
  },
  {
    title: "Resume Interview",
    description:
      "Practice questions generated around the projects and skills in your resume.",
    icon: FileText,
    className: "practice-purple",
    action: "Practice Resume",
    path: "/interview",
  },
  {
    title: "Speaking Practice",
    description:
      "Improve how clearly and confidently you communicate your answers.",
    icon: Mic2,
    className: "practice-blue",
    action: "Start Speaking",
    path: "/speaking",
  },
  {
    title: "Typing Practice",
    description:
      "Improve your typing speed, accuracy and consistency with focused practice.",
    icon: Keyboard,
    className: "practice-orange",
    action: "Start Typing",
    path: "/typing",
  },
];

const recentActivity = [
  {
    title: "Technical Interview",
    type: "Interview",
    score: "82%",
    date: "Today",
    icon: BriefcaseBusiness,
  },
  {
    title: "Speaking Practice",
    type: "Communication",
    score: "76%",
    date: "Yesterday",
    icon: Mic2,
  },
  {
    title: "Python Fundamentals",
    type: "Technical",
    score: "88%",
    date: "3 days ago",
    icon: BrainCircuit,
  },
];

const weakAreas = [
  {
    name: "SQL",
    score: 58,
    level: "Needs attention",
  },
  {
    name: "Data Structures",
    score: 64,
    level: "Keep practicing",
  },
  {
    name: "Answer Structure",
    score: 69,
    level: "Almost there",
  },
];

function getFirstName() {
  try {
    const currentUser =
      localStorage.getItem("currentUser");

    const pendingRegistration =
      localStorage.getItem(
        "pendingRegistration"
      );

    const user = currentUser
      ? JSON.parse(currentUser)
      : pendingRegistration
        ? JSON.parse(pendingRegistration)
        : null;

    return (
      user?.firstName ||
      user?.first_name ||
      "there"
    );
  } catch {
    return "there";
  }
}

function Dashboard() {
  const firstName = getFirstName();

  return (
    <Navbar1>

      <main className="app-content dashboard-content">

        {/* =====================================================
            DASHBOARD HEADER
        ===================================================== */}

        <section className="dashboard-header">
          <div>

            <div className="dashboard-eyebrow">
              <span className="eyebrow-dot" />
              YOUR INTERVIEW WORKSPACE
            </div>

            <h1>
              Welcome back,{" "}
              <span>{firstName}</span>
            </h1>

            <p>
              Keep practicing, improve your weak
              areas and get one step closer to
              your next interview.
            </p>

          </div>

          <div className="header-streak">

            <div className="streak-icon">
              <Flame size={20} />
            </div>

            <div>
              <strong>5 day streak</strong>
              <span>
                Keep the momentum going
              </span>
            </div>

          </div>
        </section>

        {/* =====================================================
            READINESS
        ===================================================== */}

        <section className="readiness-card">

          <div className="readiness-glow readiness-glow-one" />
          <div className="readiness-glow readiness-glow-two" />

          <div className="readiness-main">

            <div className="readiness-icon">
              <Target size={23} />
            </div>

            <div>
              <span className="readiness-label">
                INTERVIEW READINESS
              </span>

              <div className="readiness-score-row">
                <strong>74%</strong>
                <span>Good progress</span>
              </div>

              <p>
                Your overall preparation is moving
                in the right direction. Focus on SQL
                and answer structure next.
              </p>
            </div>

          </div>

          <div className="readiness-progress-area">

            <div className="readiness-progress-track">
              <div
                className="readiness-progress-fill"
                style={{ width: "74%" }}
              />
            </div>

            <div className="readiness-progress-labels">
              <span>Needs work</span>
              <span>Interview ready</span>
            </div>

          </div>

        </section>

        {/* =====================================================
            PERFORMANCE
        ===================================================== */}

        <section className="dashboard-section">

          <div className="section-heading">
            <div>
              <span className="section-kicker">
                OVERVIEW
              </span>

              <h2>Your performance</h2>
            </div>
          </div>

          <div className="stats-grid">

            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  className={`stat-card ${stat.className}`}
                  key={stat.title}
                >

                  <div className="stat-card-top">

                    <div className="stat-icon">
                      <Icon size={20} />
                    </div>

                    <ArrowUpRight
                      size={17}
                      className="stat-arrow"
                    />

                  </div>

                  <div className="stat-value">
                    {stat.value}

                    {stat.suffix && (
                      <small>
                        {stat.suffix}
                      </small>
                    )}
                  </div>

                  <div className="stat-title">
                    {stat.title}
                  </div>

                  <div className="stat-change">
                    <TrendingUp size={13} />
                    {stat.change}
                  </div>

                </article>
              );
            })}

          </div>

        </section>

        {/* =====================================================
            PRACTICE
        ===================================================== */}

        <section className="dashboard-section">

          <div className="section-heading section-heading-with-action">

            <div>
              <span className="section-kicker">
                PRACTICE
              </span>

              <h2>Choose your practice</h2>
            </div>

            <a
              href="/interview"
              className="section-link"
            >
              View all
              <ChevronRight size={15} />
            </a>

          </div>

          <div className="practice-grid">

            {practiceCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  className={`practice-card ${card.className}`}
                  key={card.title}
                >

                  <div className="practice-card-top">

                    <div className="practice-icon">
                      <Icon size={22} />
                    </div>

                    <div className="practice-arrow">
                      <ArrowUpRight size={17} />
                    </div>

                  </div>

                  <h3>{card.title}</h3>

                  <p>{card.description}</p>

                  <a
                    href={card.path}
                    className="practice-button"
                  >
                    <Play
                      size={14}
                      fill="currentColor"
                    />
                    {card.action}
                  </a>

                </article>
              );
            })}

          </div>

        </section>

        {/* =====================================================
            RESUME + ACTIVITY
        ===================================================== */}

        <section className="dashboard-lower-grid">

          <article className="resume-card dashboard-panel">

            <div className="panel-header">

              <div>
                <span className="section-kicker">
                  YOUR RESUME
                </span>

                <h2>Resume status</h2>
              </div>

              <div className="resume-status">
                <CheckCircle2 size={15} />
                Saved
              </div>

            </div>

            <div className="resume-preview">

              <div className="resume-file-icon">
                <FileText size={25} />
              </div>

              <div className="resume-file-info">
                <strong>My Resume.pdf</strong>

                <span>
                  Ready for resume-based interviews
                </span>
              </div>

            </div>

            <div className="resume-actions">

              <a
                href="/profile"
                className="secondary-action"
              >
                View Resume
              </a>

              <a
                href="/profile"
                className="primary-action"
              >
                Update Resume
                <ArrowUpRight size={15} />
              </a>

            </div>

          </article>

          <article className="activity-card dashboard-panel">

            <div className="panel-header">

              <div>
                <span className="section-kicker">
                  RECENT ACTIVITY
                </span>

                <h2>Latest practice</h2>
              </div>

              <Clock3
                size={19}
                className="panel-header-icon"
              />

            </div>

            <div className="activity-list">

              {recentActivity.map((activity) => {
                const Icon = activity.icon;

                return (
                  <div
                    className="activity-item"
                    key={activity.title}
                  >

                    <div className="activity-icon">
                      <Icon size={17} />
                    </div>

                    <div className="activity-info">

                      <strong>
                        {activity.title}
                      </strong>

                      <span>
                        {activity.type} ·{" "}
                        {activity.date}
                      </span>

                    </div>

                    <div className="activity-score">
                      {activity.score}
                    </div>

                  </div>
                );
              })}

            </div>

          </article>

        </section>

        {/* =====================================================
            WEAK AREAS + AI COACH
        ===================================================== */}

        <section className="dashboard-lower-grid second-row">

          <article className="weak-card dashboard-panel">

            <div className="panel-header">

              <div>
                <span className="section-kicker">
                  IMPROVEMENT AREAS
                </span>

                <h2>Focus next</h2>
              </div>

              <TrendingUp
                size={19}
                className="panel-header-icon"
              />

            </div>

            <div className="weak-list">

              {weakAreas.map((area) => (
                <div
                  className="weak-item"
                  key={area.name}
                >

                  <div className="weak-top">

                    <div>
                      <strong>
                        {area.name}
                      </strong>

                      <span>
                        {area.level}
                      </span>
                    </div>

                    <b>
                      {area.score}%
                    </b>

                  </div>

                  <div className="weak-progress-track">

                    <div
                      className="weak-progress-fill"
                      style={{
                        width: `${area.score}%`,
                      }}
                    />

                  </div>

                </div>
              ))}

            </div>

          </article>

          <article className="ai-coach-card dashboard-panel">

            <div className="ai-card-glow" />

            <div className="ai-card-icon">
              <Sparkles size={22} />
            </div>

            <span className="section-kicker">
              AI COACH
            </span>

            <h2>
              Need help preparing?
            </h2>

            <p>
              Ask AI about interview questions,
              your resume, technical concepts or
              how to improve your answers.
            </p>

            <a
              href="/ask-ai"
              className="ai-coach-button"
            >
              <BrainCircuit size={17} />
              Ask AI
              <ArrowUpRight size={15} />
            </a>

          </article>

        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="dashboard-footer">
          <span>
            AI Interview Training Platform
          </span>

          <span>
            Keep learning. Keep improving.
          </span>
        </footer>

      </main>

    </Navbar1>
  );
}

export default Dashboard;