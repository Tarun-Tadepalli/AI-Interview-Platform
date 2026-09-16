import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  BrainCircuit,
  Check,
  Code2,
  FileText,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import Navbar1 from "../components/Navbar1";
import "../styles/ask-ai.css";

const quickPrompts = [
  {
    icon: FileText,
    title: "Review my resume",
    prompt:
      "How can I improve my resume for software developer roles?",
  },
  {
    icon: Code2,
    title: "Explain a concept",
    prompt:
      "Explain REST APIs in a simple way and give me an interview-ready answer.",
  },
  {
    icon: MessageSquare,
    title: "Interview question",
    prompt:
      "Give me a technical interview question and help me improve my answer.",
  },
  {
    icon: Sparkles,
    title: "Prepare with AI",
    prompt:
      "Create a focused interview preparation plan for me.",
  },
];

const initialMessage = {
  id: 1,
  role: "assistant",
  content:
    "Hi! I'm your AI Interview assistant. You can ask me about interview preparation, your resume, technical concepts, behavioral questions, or how to improve your answers.",
};

const getSavedMessages = () => {
  try {
    const saved = JSON.parse(
      localStorage.getItem("aiAskAIConversation") || "null"
    );

    return Array.isArray(saved) && saved.length
      ? saved
      : [initialMessage];
  } catch {
    return [initialMessage];
  }
};

const getResponse = (question) => {
  const text = question.toLowerCase();

  if (text.includes("resume")) {
    return "I can help you improve your resume by reviewing your skills, projects, experience, education, and how well they match your target role. Once the backend is connected, I'll also be able to use your saved resume directly for personalized suggestions.";
  }

  if (
    text.includes("interview") ||
    text.includes("question")
  ) {
    return "A good interview strategy is to answer clearly, explain your reasoning, and support your answer with a practical example. Once Gemini is connected, I can generate questions based on your selected role, experience, interview focus, and resume.";
  }

  if (
    text.includes("python") ||
    text.includes("sql") ||
    text.includes("javascript") ||
    text.includes("coding") ||
    text.includes("programming")
  ) {
    return "I can help you prepare programming and technical questions, explain concepts step by step, review code, and create interview-style practice questions. Later, the AI backend will provide personalized answers using Gemini.";
  }

  if (
    text.includes("behavioral") ||
    text.includes("hr") ||
    text.includes("strength") ||
    text.includes("weakness")
  ) {
    return "For behavioral questions, structure your answer around the situation, your responsibility, the action you took, and the result. This gives the interviewer a clear understanding of your experience.";
  }

  return "That's a good question. I can help you with interview preparation, resume improvement, technical concepts, coding, behavioral questions, and communication. The full AI-powered response system will be connected through the backend and Gemini later.";
};

const AskAI = () => {
  const [messages, setMessages] = useState(getSavedMessages);
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(
      "aiAskAIConversation",
      JSON.stringify(messages)
    );
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = (value = input) => {
    const question = value.trim();

    if (!question) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: question,
    };

    const assistantMessage = {
      id: Date.now() + 1,
      role: "assistant",
      content: getResponse(question),
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
      assistantMessage,
    ]);

    setInput("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const clearConversation = () => {
    setMessages([initialMessage]);
    localStorage.removeItem("aiAskAIConversation");
  };

  const copyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(message.id);

      setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <Navbar1>
      <main className="app-content ask-ai-content">
        <div className="ask-ai-header">
          <div>
            <span className="ask-ai-eyebrow">
              AI ASSISTANT
            </span>

            <h1>Ask AI</h1>

            <p>
              Get help with interview preparation, your resume,
              technical concepts, and career questions.
            </p>
          </div>

          <button
            type="button"
            className="clear-chat-button"
            onClick={clearConversation}
          >
            <Trash2 size={16} />
            Clear chat
          </button>
        </div>

        <section className="ask-ai-layout">
          <aside className="ask-ai-sidebar">
            <div className="assistant-profile">
              <div className="assistant-avatar">
                <BrainCircuit size={23} />
              </div>

              <div>
                <strong>AI Interview Assistant</strong>
                <span>Ready to help</span>
              </div>
            </div>

            <div className="sidebar-section">
              <span className="sidebar-label">
                QUICK START
              </span>

              <div className="quick-prompt-list">
                {quickPrompts.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      type="button"
                      className="quick-prompt"
                      key={item.title}
                      onClick={() => sendMessage(item.prompt)}
                    >
                      <div className="quick-prompt-icon">
                        <Icon size={16} />
                      </div>

                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.prompt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sidebar-note">
              <Sparkles size={16} />

              <div>
                <strong>Personalized AI</strong>
                <p>
                  Later, AI will use your profile and resume
                  to provide more relevant answers.
                </p>
              </div>
            </div>
          </aside>

          <section className="chat-panel">
            <div className="chat-header">
              <div className="chat-title">
                <div className="chat-status-dot" />

                <div>
                  <strong>AI Interview Assistant</strong>
                  <span>Ask anything about your preparation</span>
                </div>
              </div>

              <div className="chat-header-label">
                <Sparkles size={14} />
                AI
              </div>
            </div>

            <div className="messages-area">
              {messages.map((message) => (
                <div
                  className={`message-row ${message.role}`}
                  key={message.id}
                >
                  <div className="message-avatar">
                    {message.role === "assistant" ? (
                      <BrainCircuit size={17} />
                    ) : (
                      <User size={17} />
                    )}
                  </div>

                  <div className="message-content">
                    <div className="message-meta">
                      <strong>
                        {message.role === "assistant"
                          ? "AI Assistant"
                          : "You"}
                      </strong>
                    </div>

                    <div className="message-bubble">
                      <p>{message.content}</p>
                    </div>

                    {message.role === "assistant" && (
                      <button
                        type="button"
                        className="copy-button"
                        onClick={() =>
                          copyMessage(message)
                        }
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check size={13} />
                            Copied
                          </>
                        ) : (
                          <>
                            <RotateCcw size={13} />
                            Copy response
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <div className="input-wrapper">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask AI anything..."
                  rows={1}
                />

                <button
                  type="button"
                  className="send-button"
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  aria-label="Send message"
                >
                  <ArrowUp size={18} />
                </button>
              </div>

              <span className="input-hint">
                Press Enter to send · Shift + Enter for a new
                line
              </span>
            </div>
          </section>
        </section>

        <footer className="ask-ai-footer">
          <span>AI Interview Training Platform</span>
          <span>
            AI responses will be powered by Gemini after backend
            integration.
          </span>
        </footer>
      </main>
    </Navbar1>
  );
};

export default AskAI;