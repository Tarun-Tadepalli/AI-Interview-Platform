import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  ChevronDown,
  Code2,
  MessageCircle,
  Mic,
  Play,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Video,
  Zap,
} from "lucide-react";

import "../styles/home.css";
import PublicAskAIWidget from "../components/PublicAskAIWidget";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Interviews",
    text: "Practice realistic interviews with an intelligent AI interviewer that adapts to your role and experience.",
  },
  {
    icon: BarChart3,
    title: "Deep Performance Analysis",
    text: "Understand your strengths, weaknesses, communication quality and technical performance.",
  },
  {
    icon: MessageCircle,
    title: "Instant AI Feedback",
    text: "Get personalized feedback after every answer instead of waiting for someone to evaluate you.",
  },
  {
    icon: Target,
    title: "Role-Based Practice",
    text: "Prepare specifically for software engineering, data science, HR, behavioral and other interview types.",
  },
  {
    icon: Code2,
    title: "Technical Evaluation",
    text: "Practice technical questions and coding-oriented interview scenarios designed around your target role.",
  },
  {
    icon: Trophy,
    title: "Track Your Progress",
    text: "Monitor your interview performance over time and identify where you are improving.",
  },
];

const modes = [
  {
    title: "Technical Interview",
    description: "Test your technical knowledge and problem-solving ability.",
    icon: Code2,
  },
  {
    title: "HR Interview",
    description: "Practice communication, confidence and common HR questions.",
    icon: UserRound,
  },
  {
    title: "Behavioral Interview",
    description: "Prepare structured answers for real-world workplace situations.",
    icon: MessageCircle,
  },
  {
    title: "AI Mock Interview",
    description: "Experience a complete interview simulation with AI.",
    icon: Video,
  },
];

function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 45 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

function Home() {
  return (
    <div className="home-page">

      {/* BACKGROUND */}
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grid-background" />

      {/* NAVBAR */}
      <header className="home-navbar">
        <a href="/" className="brand">
          <div className="brand-icon">
            <Brain size={38} />
          </div>

          <div>
            <span className="brand-main">AI Interview</span>
            <span className="brand-sub">Training Platform</span>
          </div>
        </a>

        <nav className="desktop-nav">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#interview-modes">Interviews</a>
          <a href="#ai-analysis">AI Analysis</a>
        </nav>

        <div className="nav-actions">
          <a href="/login" className="nav-login">
            Login
          </a>

          <a href="/register" className="nav-start">
            Get Started
            <ArrowRight size={16} />
          </a>
        </div>
      </header>

      {/* HERO */}
      <main>

        <section className="hero-section">

          <div className="hero-content">

            <Reveal>
              <div className="hero-badge">
                <span className="live-dot" />
                <Sparkles size={15} />
                AI-powered interview preparation
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1>
                Your next interview
                <span> starts here.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.15}>
              <p className="hero-description">
                Practice realistic interviews with AI, receive instant
                feedback, analyze your performance and build the confidence
                you need to succeed.
              </p>
            </Reveal>

            <Reveal delay={0.22}>
              <div className="hero-buttons">

                <a href="/register" className="primary-button">
                  Start Practicing
                  <ArrowRight size={18} />
                </a>

                <a href="#how-it-works" className="secondary-button">
                  <Play size={16} fill="currentColor" />
                  See how it works
                </a>

              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="hero-trust">

                <div className="trust-item">
                  <Check size={15} />
                  AI-powered feedback
                </div>

                <div className="trust-item">
                  <Check size={15} />
                  Personalized practice
                </div>

                <div className="trust-item">
                  <Check size={15} />
                  Practice anytime
                </div>

              </div>
            </Reveal>

          </div>

          {/* AI VISUAL */}
          <Reveal delay={0.2} className="hero-visual-wrapper">

            <div className="hero-visual">

              <div className="visual-glow" />

              <div className="ai-orbit orbit-one" />
              <div className="ai-orbit orbit-two" />

              <div className="ai-core">
                <div className="core-inner">
                  <Brain size={52} />
                  <span>AI</span>
                </div>
              </div>

              <div className="floating-card card-top">
                <div className="mini-icon purple">
                  <Mic size={16} />
                </div>

                <div>
                  <strong>Listening</strong>
                  <small>Analyzing answer…</small>
                </div>

                <span className="status-dot" />
              </div>

              <div className="floating-card card-right">
                <div className="score-ring">
                  <span>87</span>
                </div>

                <div>
                  <strong>Interview Score</strong>
                  <small>Excellent progress</small>
                </div>
              </div>

              <div className="floating-card card-bottom">

                <div className="mini-icon blue">
                  <BarChart3 size={17} />
                </div>

                <div className="mini-progress">
                  <strong>Performance</strong>

                  <div className="progress-track">
                    <div className="progress-fill" />
                  </div>
                </div>

                <span>87%</span>

              </div>

            </div>

          </Reveal>

        </section>


        {/* TRUST STRIP */}
        <section className="trust-strip">

          <p>BUILT FOR MODERN INTERVIEW PREPARATION</p>

          <div className="tech-strip">

            <span>
              <Brain size={17} />
              AI Interviewer
            </span>

            <span>
              <Zap size={17} />
              Real-time Feedback
            </span>

            <span>
              <BarChart3 size={17} />
              Performance Analytics
            </span>

            <span>
              <Target size={17} />
              Personalized Practice
            </span>

          </div>

        </section>


        {/* HOW IT WORKS */}
        <section id="how-it-works" className="section how-section">

          <Reveal>
            <div className="section-heading">

              <div className="section-label">
                <Sparkles size={15} />
                HOW IT WORKS
              </div>

              <h2>
                From nervous preparation
                <span> to confident performance.</span>
              </h2>

              <p>
                Everything you need to turn interview preparation into
                measurable progress.
              </p>

            </div>
          </Reveal>


          <div className="steps-grid">

            <Reveal delay={0.05}>
              <div className="step-card">

                <div className="step-number">01</div>

                <div className="step-icon">
                  <Target size={25} />
                </div>

                <h3>Choose your interview</h3>

                <p>
                  Select your role, experience level and interview type.
                </p>

                <div className="step-arrow">
                  <ArrowRight size={18} />
                </div>

              </div>
            </Reveal>


            <Reveal delay={0.12}>
              <div className="step-card">

                <div className="step-number">02</div>

                <div className="step-icon">
                  <Mic size={25} />
                </div>

                <h3>Interview with AI</h3>

                <p>
                  Answer realistic questions in an interactive AI interview.
                </p>

                <div className="step-arrow">
                  <ArrowRight size={18} />
                </div>

              </div>
            </Reveal>


            <Reveal delay={0.19}>
              <div className="step-card">

                <div className="step-number">03</div>

                <div className="step-icon">
                  <BarChart3 size={25} />
                </div>

                <h3>Analyze your performance</h3>

                <p>
                  Receive detailed feedback and understand exactly what
                  to improve.
                </p>

              </div>
            </Reveal>

          </div>

        </section>


        {/* FEATURES */}
        <section id="features" className="section features-section">

          <Reveal>

            <div className="section-heading left-heading">

              <div className="section-label">
                <Zap size={15} />
                PLATFORM CAPABILITIES
              </div>

              <h2>
                Everything you need
                <span> to interview better.</span>
              </h2>

              <p>
                A complete AI-powered environment designed around the
                modern interview process.
              </p>

            </div>

          </Reveal>


          <div className="features-grid">

            {features.map((feature, index) => {

              const Icon = feature.icon;

              return (
                <Reveal key={feature.title} delay={index * 0.05}>

                  <div className="feature-card">

                    <div className="feature-icon">
                      <Icon size={22} />
                    </div>

                    <div className="feature-content">

                      <h3>{feature.title}</h3>

                      <p>{feature.text}</p>

                      <div className="feature-link">
                        Explore
                        <ArrowRight size={15} />
                      </div>

                    </div>

                  </div>

                </Reveal>
              );
            })}

          </div>

        </section>


        {/* INTERVIEW MODES */}
        <section
          id="interview-modes"
          className="section modes-section"
        >

          <Reveal>

            <div className="section-heading">

              <div className="section-label">
                <Video size={15} />
                INTERVIEW MODES
              </div>

              <h2>
                One platform.
                <span> Every interview scenario.</span>
              </h2>

            </div>

          </Reveal>


          <div className="modes-grid">

            {modes.map((mode, index) => {

              const Icon = mode.icon;

              return (
                <Reveal key={mode.title} delay={index * 0.08}>

                  <div className="mode-card">

                    <div className="mode-icon">
                      <Icon size={25} />
                    </div>

                    <div className="mode-index">
                      0{index + 1}
                    </div>

                    <h3>{mode.title}</h3>

                    <p>{mode.description}</p>

                    <div className="mode-arrow">
                      <ArrowRight size={18} />
                    </div>

                  </div>

                </Reveal>
              );
            })}

          </div>

        </section>


        {/* AI ANALYSIS */}
        <section id="ai-analysis" className="section analysis-section">

          <div className="analysis-layout">

            <Reveal className="analysis-text">

              <div className="section-label">
                <BarChart3 size={15} />
                AI PERFORMANCE ANALYSIS
              </div>

              <h2>
                Don't just practice.
                <span> Understand your performance.</span>
              </h2>

              <p>
                Your AI interview session becomes measurable data.
                Understand where you're strong, where you're struggling,
                and what you should practice next.
              </p>

              <div className="analysis-checks">

                <div>
                  <Check size={16} />
                  Communication analysis
                </div>

                <div>
                  <Check size={16} />
                  Technical performance
                </div>

                <div>
                  <Check size={16} />
                  Confidence indicators
                </div>

                <div>
                  <Check size={16} />
                  Personalized recommendations
                </div>

              </div>

            </Reveal>


            <Reveal delay={0.15} className="dashboard-wrapper">

              <div className="analysis-dashboard">

                <div className="dashboard-header">

                  <div>
                    <span>Interview Performance</span>
                    <strong>Software Engineer</strong>
                  </div>

                  <span className="dashboard-status">
                    Completed
                  </span>

                </div>


                <div className="overall-score">

                  <div className="big-score">
                    87<span>%</span>
                  </div>

                  <div>
                    <strong>Excellent performance</strong>
                    <p>+8% from your previous interview</p>
                  </div>

                </div>


                <div className="metric">

                  <div>
                    <span>Communication</span>
                    <strong>87%</strong>
                  </div>

                  <div className="metric-track">
                    <div style={{ width: "87%" }} />
                  </div>

                </div>


                <div className="metric">

                  <div>
                    <span>Technical Skills</span>
                    <strong>79%</strong>
                  </div>

                  <div className="metric-track">
                    <div style={{ width: "79%" }} />
                  </div>

                </div>


                <div className="metric">

                  <div>
                    <span>Confidence</span>
                    <strong>91%</strong>
                  </div>

                  <div className="metric-track">
                    <div style={{ width: "91%" }} />
                  </div>

                </div>


                <div className="metric">

                  <div>
                    <span>Answer Clarity</span>
                    <strong>84%</strong>
                  </div>

                  <div className="metric-track">
                    <div style={{ width: "84%" }} />
                  </div>

                </div>


                <div className="ai-recommendation">

                  <Sparkles size={18} />

                  <div>
                    <strong>AI Recommendation</strong>
                    <p>
                      Practice explaining technical concepts
                      more concisely.
                    </p>
                  </div>

                </div>

              </div>

            </Reveal>

          </div>

        </section>


        {/* STATS */}
        <section className="stats-section">

          <Reveal>

            <div className="stats-grid">

              <div>
                <strong>24/7</strong>
                <span>Practice availability</span>
              </div>

              <div>
                <strong>AI</strong>
                <span>Personalized feedback</span>
              </div>

              <div>
                <strong>∞</strong>
                <span>Practice sessions</span>
              </div>

              <div>
                <strong>1</strong>
                <span>Complete platform</span>
              </div>

            </div>

          </Reveal>

        </section>


        {/* CTA */}
        <section className="cta-section">

          <div className="cta-glow" />

          <Reveal>

            <div className="cta-content">

              <div className="section-label">
                <Sparkles size={15} />
                START YOUR JOURNEY
              </div>

              <h2>
                Your next interview
                <span> can be better.</span>
              </h2>

              <p>
                Stop preparing alone. Practice with AI and walk into
                your next interview with confidence.
              </p>

              <a href="/register" className="primary-button cta-button">
                Start Practicing Free
                <ArrowRight size={18} />
              </a>

            </div>

          </Reveal>

        </section>

      </main>


      {/* FOOTER */}
      <footer className="home-footer">

        <div className="footer-main">

          <div className="footer-brand">

            <a href="/" className="brand">

              <div className="brand-icon">
                <Brain size={20} />
              </div>

              <div>
                <span className="brand-main">
                  AI Interview
                </span>

                <span className="brand-sub">
                  Training Platform
                </span>
              </div>

            </a>

            <p>
              AI-powered interview preparation built to help you
              practice smarter and perform better.
            </p>

          </div>


          <div className="footer-column">

            <h4>Platform</h4>

            <a href="#features">Features</a>
            <a href="#interview-modes">Interview Modes</a>
            <a href="#ai-analysis">AI Analysis</a>
            <a href="#how-it-works">How It Works</a>

          </div>


          <div className="footer-column">

            <h4>Account</h4>

            <a href="/login">Login</a>
            <a href="/register">Register</a>
            <a href="/forgot-password">Forgot Password</a>

          </div>


          <div className="footer-column">

            <h4>Technology</h4>

            <span>Artificial Intelligence</span>
            <span>LLM Integration</span>
            <span>RAG</span>
            <span>AI Chatbot</span>

          </div>

        </div>


        <div className="footer-bottom">

          <span>
            © 2026 AI Interview Training Platform
          </span>

          <span>
            Built with AI • React • FastAPI
          </span>

        </div>

      </footer>


      {/* PUBLIC WEBSITE CHATBOT */}
      <PublicAskAIWidget />


      {/* SCROLL INDICATOR */}
      <motion.div
        className="scroll-indicator"
        animate={{ y: [0, 7, 0] }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
        }}
      >
        <ChevronDown size={19} />
      </motion.div>

    </div>
  );
}

export default Home;