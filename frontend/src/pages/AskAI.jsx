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
import { sendPrivateAskAIMessage } from "../services/askAiService";
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


const renderInlineMarkdown = (text, keyPrefix = "inline") => {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
  const parts = String(text).split(pattern);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

const FormattedMessage = ({ content }) => {
  const lines = String(content || "").replace(/\r/g, "").split("\n");
  const blocks = [];
  let paragraph = [];
  let listItems = [];
  let listType = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", lines: paragraph });
    paragraph = [];
  };
  const flushList = () => {
    if (!listItems.length) return;
    blocks.push({ type: listType || "ul", items: listItems });
    listItems = [];
    listType = null;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    const bullet = line.match(/^[-*+]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (!line || /^[-*_]{3,}$/.test(line)) {
      flushParagraph(); flushList();
      return;
    }
    if (bullet || numbered) {
      flushParagraph();
      const type = numbered ? "ol" : "ul";
      if (listType && listType !== type) flushList();
      listType = type;
      listItems.push((bullet || numbered)[1]);
      return;
    }
    flushList();
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      blocks.push({ type: `h${Math.min(heading[1].length + 2, 5)}`, text: heading[2].replace(/\*\*/g, "") });
      return;
    }
    paragraph.push(line);
  });
  flushParagraph(); flushList();

  return (
    <div className="formatted-message">
      {blocks.map((block, index) => {
        if (block.type === "ul" || block.type === "ol") {
          const ListTag = block.type;
          return <ListTag key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(item, `list-${index}-${itemIndex}`)}</li>)}</ListTag>;
        }
        if (block.type.startsWith("h")) {
          const HeadingTag = block.type;
          return <HeadingTag key={index}>{renderInlineMarkdown(block.text, `heading-${index}`)}</HeadingTag>;
        }
        return <p key={index}>{renderInlineMarkdown(block.lines.join(" "), `paragraph-${index}`)}</p>;
      })}
    </div>
  );
};

const HANDOFF_KEY = "askAiHandoff";

const readHandoff = () => {
  try {
    const handoff = JSON.parse(sessionStorage.getItem(HANDOFF_KEY) || "null");
    if (
      handoff &&
      handoff.createdAt &&
      Date.now() - handoff.createdAt < 2 * 60 * 60 * 1000 &&
      Array.isArray(handoff.messages)
    ) {
      return handoff;
    }
  } catch {
    // A malformed temporary handoff should not stop the page from loading.
  }
  return null;
};

// Chat is temporary: preserve it during refresh/navigation in this tab only.
const PRIVATE_CHAT_KEY = "aiAskAIConversation";

const getSavedMessages = () => {
  const handoff = readHandoff();
  if (handoff) {
    const restored = handoff.messages
      .filter((message) => !message.requiresLogin)
      .map((message, index) => ({
        ...message,
        id: message.id ?? `restored-${index}-${Date.now()}`,
      }));
    return restored.length ? restored : [initialMessage];
  }

  try {
    const saved = JSON.parse(
      sessionStorage.getItem(PRIVATE_CHAT_KEY) || "null"
    );
    return Array.isArray(saved) && saved.length ? saved : [initialMessage];
  } catch {
    return [initialMessage];
  }
};

const AskAI = () => {
  const [messages, setMessages] = useState(getSavedMessages);
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const handoffRef = useRef(readHandoff());
  const handoffProcessedRef = useRef(false);

  useEffect(() => {
    // Private Ask AI messages must not persist across logout/new login.
    sessionStorage.setItem(PRIVATE_CHAT_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const sendMessage = async (value = input, options = {}) => {
    const question = value.trim();
    if (!question || isSending) return;

    const appendUserMessage = options.appendUserMessage !== false;
    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: question,
    };

    if (appendUserMessage) {
      setMessages((previous) => [...previous, userMessage]);
    }
    setInput("");
    setSendError("");
    setIsSending(true);

    // Do not resend the original handoff question as part of its own history.
    let history = messages.filter((message) =>
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" && message.content.trim()
    );
    if (!appendUserMessage && history.length && history[history.length - 1].role === "user" && history[history.length - 1].content.trim() === question) {
      history = history.slice(0, -1);
    }
    history = history.slice(-10).map(({ role, content }) => ({ role, content }));

    try {
      const result = await sendPrivateAskAIMessage(question, history);
      setMessages((previous) => [...previous, {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: result.answer,
      }]);
    } catch (error) {
      setSendError(
        error.response?.data?.detail ||
        "Ask AI could not respond right now. Please try again."
      );
    } finally {
      setIsSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  useEffect(() => {
    if (handoffProcessedRef.current) return;
    handoffProcessedRef.current = true;
    const handoff = handoffRef.current;
    if (!handoff) return;

    // Remove the temporary handoff before the AI request so refreshes do not resend it.
    sessionStorage.removeItem(HANDOFF_KEY);
    if (handoff.pendingQuestion && handoff.pendingQuestion.trim()) {
      sendMessage(handoff.pendingQuestion, { appendUserMessage: false });
    }
  }, []);

  const clearConversation = () => {
    setMessages([initialMessage]);
    setSendError("");
    sessionStorage.removeItem(PRIVATE_CHAT_KEY);
    sessionStorage.removeItem(HANDOFF_KEY);
    handoffRef.current = null;
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
                <span>{isSending ? "Thinking…" : "Connected to AI"}</span>
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
                  Ask about technical concepts, interview preparation,
                  your resume, and your saved practice results.
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
                      {message.role === "assistant" ? <FormattedMessage content={message.content} /> : <p>{message.content}</p>}
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

              {isSending && (
                <div className="message-row assistant">
                  <div className="message-avatar"><BrainCircuit size={17} /></div>
                  <div className="message-content"><div className="message-bubble"><p>Thinking through your question…</p></div></div>
                </div>
              )}
              {sendError && (
                <div className="ask-ai-error" role="alert">
                  <span>{sendError}</span>
                  <button type="button" onClick={() => sendMessage(messages.filter((item) => item.role === "user").slice(-1)[0]?.content || "", { appendUserMessage: false })}>Retry</button>
                </div>
              )}
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
                  disabled={!input.trim() || isSending}
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
            Responses are generated by Gemini through the secure backend.
          </span>
        </footer>
      </main>
    </Navbar1>
  );
};

export default AskAI;