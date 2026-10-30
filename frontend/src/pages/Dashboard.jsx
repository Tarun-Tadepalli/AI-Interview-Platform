import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight, BriefcaseBusiness, CheckCircle2, ChevronRight, Clock3,
  FileText, Flame, Mic2, Target, TrendingUp, Keyboard, BrainCircuit,
  Sparkles, Play, RefreshCw, AlertCircle
} from "lucide-react";
import Navbar1 from "../components/Navbar1";
import { getDashboardSummary } from "../services/dashboardService";
import "../styles/dashboard.css";

const practiceCards = [
  { title: "Interview Practice", description: "Practice resume-based questions and review your interview performance.", icon: BriefcaseBusiness, className: "practice-red", action: "Start Interview", path: "/interview" },
  { title: "Speaking Practice", description: "Improve clarity, confidence and the structure of your spoken answers.", icon: Mic2, className: "practice-blue", action: "Start Speaking", path: "/speaking" },
  { title: "Typing Practice", description: "Build typing speed and accuracy through timed practice.", icon: Keyboard, className: "practice-orange", action: "Start Typing", path: "/typing" },
  { title: "Ask AI", description: "Get guidance based on your resume and saved practice results.", icon: BrainCircuit, className: "practice-purple", action: "Ask AI", path: "/ask-ai" },
];

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function displayNumber(value, suffix = "") {
  return value === null || value === undefined ? "—" : `${value}${suffix}`;
}

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err?.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const firstName = summary?.user?.first_name || (() => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "null");
      return user?.firstName || user?.first_name || "there";
    } catch { return "there"; }
  })();

  const stats = [
    { title: "Interviews Completed", value: displayNumber(summary?.stats?.interviews_completed), change: "Saved interview sessions", icon: BriefcaseBusiness, className: "stat-red" },
    { title: "Average Practice Score", value: displayNumber(summary?.stats?.average_score, summary?.stats?.average_score == null ? "" : "%"), change: "Completed speaking and interview scores", icon: TrendingUp, className: "stat-purple" },
    { title: "Average Speaking Score", value: displayNumber(summary?.stats?.speaking_score, summary?.stats?.speaking_score == null ? "" : "%"), change: `${summary?.stats?.speaking_sessions ?? 0} completed sessions`, icon: Mic2, className: "stat-blue" },
    { title: "Average Typing Speed", value: displayNumber(summary?.stats?.typing_wpm, summary?.stats?.typing_wpm == null ? "" : " WPM"), change: `${summary?.stats?.typing_accuracy == null ? "No accuracy data" : `${summary.stats.typing_accuracy}% average accuracy`}`, icon: Keyboard, className: "stat-orange" },
  ];

  return (
    <Navbar1>
      <main className="app-content dashboard-content">
        <section className="dashboard-header">
          <div>
            <div className="dashboard-eyebrow"><span className="eyebrow-dot" /> YOUR INTERVIEW WORKSPACE</div>
            <h1>Welcome back, <span>{firstName}</span></h1>
            <p>Your dashboard brings together your saved practice sessions, measured performance and next steps.</p>
          </div>
          <div className="header-streak">
            <div className="streak-icon"><Flame size={20} /></div>
            <div><strong>{summary ? `${summary.streak_days} day streak` : "Practice streak"}</strong><span>{summary?.streak_days ? "Based on recorded activity dates" : "Complete a practice session to build your streak"}</span></div>
          </div>
        </section>

        {error && (
          <section className="dashboard-error" role="alert">
            <AlertCircle size={18} />
            <div><strong>Dashboard data could not be loaded</strong><p>{error}</p><span>Check that the backend is running and that you are logged in.</span></div>
            <button type="button" onClick={loadDashboard}><RefreshCw size={15} /> Retry</button>
          </section>
        )}

        <section className="readiness-card">
          <div className="readiness-glow readiness-glow-one" /><div className="readiness-glow readiness-glow-two" />
          <div className="readiness-main">
            <div className="readiness-icon"><Target size={23} /></div>
            <div>
              <span className="readiness-label">PREPARATION SNAPSHOT</span>
              <div className="readiness-score-row"><strong>{loading ? "…" : displayNumber(summary?.readiness, summary?.readiness == null ? "" : "%")}</strong><span>{summary?.readiness == null ? "Build your baseline" : summary.readiness >= 80 ? "Strong measured results" : summary.readiness >= 65 ? "Making progress" : "Keep practicing"}</span></div>
              <p>{summary?.readiness == null ? "Complete speaking, typing or interview practice to populate your dashboard with measured results." : "This snapshot averages available interview scores, speaking scores and typing accuracy. Missing measures are excluded."}</p>
            </div>
          </div>
          <div className="readiness-progress-area">
            <div className="readiness-progress-track"><div className="readiness-progress-fill" style={{ width: `${summary?.readiness ?? 0}%` }} /></div>
            <div className="readiness-progress-labels"><span>No saved baseline</span><span>100%</span></div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-heading"><div><span className="section-kicker">LIVE OVERVIEW</span><h2>Your performance</h2></div><button className="dashboard-refresh" type="button" onClick={loadDashboard} disabled={loading}><RefreshCw size={14} /> Refresh</button></div>
          <div className="stats-grid">
            {stats.map((stat) => { const Icon = stat.icon; return <article className={`stat-card ${stat.className}`} key={stat.title}>
              <div className="stat-card-top"><div className="stat-icon"><Icon size={20} /></div><ArrowUpRight size={17} className="stat-arrow" /></div>
              <div className="stat-value">{loading ? "…" : stat.value}</div><div className="stat-title">{stat.title}</div><div className="stat-change"><TrendingUp size={13} />{stat.change}</div>
            </article>; })}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-heading section-heading-with-action"><div><span className="section-kicker">PRACTICE</span><h2>Choose your next activity</h2></div><a href="/progress" className="section-link">View progress <ChevronRight size={15} /></a></div>
          <div className="practice-grid">
            {practiceCards.map((card) => { const Icon = card.icon; return <article className={`practice-card ${card.className}`} key={card.title}>
              <div className="practice-card-top"><div className="practice-icon"><Icon size={22} /></div><div className="practice-arrow"><ArrowUpRight size={17} /></div></div>
              <h3>{card.title}</h3><p>{card.description}</p><a href={card.path} className="practice-button"><Play size={14} fill="currentColor" />{card.action}</a>
            </article>; })}
          </div>
        </section>

        <section className="dashboard-lower-grid">
          <article className="resume-card dashboard-panel">
            <div className="panel-header"><div><span className="section-kicker">YOUR RESUME</span><h2>Resume status</h2></div>
              <div className="resume-status">{summary?.resume?.available ? <><CheckCircle2 size={15} /> Ready</> : <><FileText size={15} /> Missing</>}</div>
            </div>
            <div className="resume-preview"><div className="resume-file-icon"><FileText size={25} /></div><div className="resume-file-info"><strong>{summary?.resume?.available ? "Resume profile saved" : "No processed resume found"}</strong><span>{summary?.resume?.available ? "Available for resume-based interview practice" : "Upload and process a PDF resume from your Profile page"}</span></div></div>
            <div className="resume-actions"><a href="/profile" className="secondary-action">View Resume</a><a href="/profile" className="primary-action">Manage Resume <ArrowUpRight size={15} /></a></div>
          </article>

          <article className="activity-card dashboard-panel">
            <div className="panel-header"><div><span className="section-kicker">RECENT ACTIVITY</span><h2>Latest saved practice</h2></div><Clock3 size={19} className="panel-header-icon" /></div>
            {summary?.recent_activity?.length ? <div className="activity-list">{summary.recent_activity.map((item) => {
              const Icon = item.type === "Typing" ? Keyboard : item.type === "Speaking" ? Mic2 : BriefcaseBusiness;
              return <a className="activity-item dashboard-activity-link" href={item.path} key={item.id}>
                <div className="activity-icon"><Icon size={17} /></div><div className="activity-info"><strong>{item.title}</strong><span>{item.type} · {formatDate(item.date)}</span></div><div className="activity-score">{item.score == null ? "—" : `${Math.round(item.score)}%`}</div>
              </a>;
            })}</div> : <div className="dashboard-empty"><Clock3 size={22} /><strong>No completed practice yet</strong><span>Your saved typing, speaking and interview sessions will appear here.</span></div>}
          </article>
        </section>

        <section className="dashboard-lower-grid second-row">
          <article className="weak-card dashboard-panel"><div className="panel-header"><div><span className="section-kicker">INTERVIEW ANSWER DIMENSIONS</span><h2>Focus next</h2></div><TrendingUp size={19} className="panel-header-icon" /></div>
            {summary?.weak_areas?.length ? <div className="weak-list">{summary.weak_areas.map((area) => <div className="weak-item" key={area.name}><div className="weak-top"><div><strong>{area.name}</strong><span>{area.level}</span></div><b>{area.score}%</b></div><div className="weak-progress-track"><div className="weak-progress-fill" style={{ width: `${area.score}%` }} /></div></div>)}</div> : <div className="dashboard-empty"><Target size={22} /><strong>No answer dimensions yet</strong><span>Complete an interview with evaluated answers to see your lowest-scoring dimensions.</span></div>}
          </article>
          <article className="ai-coach-card dashboard-panel"><div className="ai-card-glow" /><div className="ai-card-icon"><Sparkles size={22} /></div><span className="section-kicker">AI COACH</span><h2>Need help preparing?</h2><p>Ask AI about your resume, saved practice results, interview questions or ways to improve.</p><a href="/ask-ai" className="ai-coach-button"><BrainCircuit size={17} />Ask AI<ArrowUpRight size={15} /></a></article>
        </section>

        <footer className="dashboard-footer"><span>AI Interview Training Platform</span><span>{summary?.generated_at ? `Data refreshed ${formatDate(summary.generated_at)}` : "Keep learning. Keep improving."}</span></footer>
      </main>
    </Navbar1>
  );
}

export default Dashboard;
