import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Sparkles, X } from "lucide-react";
import { sendPublicAskAIMessage } from "../services/askAiService";

const HANDOFF_KEY = "askAiHandoff";
const welcomeMessage = {
  id: "public-welcome",
  role: "assistant",
  content: "Hi! I'm the website assistant. Ask me about the platform, its features, or how to get started.",
};

export default function PublicAskAIWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const sendMessage = async (value = input) => {
    const question = value.trim();
    if (!question || isSending) return;

    const userMessage = { id: `${Date.now()}-user`, role: "user", content: question };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const result = await sendPublicAskAIMessage(question);
      setMessages((current) => [...current, {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: result.answer,
        requiresLogin: Boolean(result.requires_login),
      }]);
      if (result.requires_login) setPendingQuestion(question);
    } catch (error) {
      setMessages((current) => [...current, {
        id: `${Date.now()}-error`,
        role: "assistant",
        content: error.response?.data?.detail || "I couldn't connect right now. Please try again.",
      }]);
    } finally {
      setIsSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const continueAfterLogin = () => {
    const handoff = { messages, pendingQuestion, createdAt: Date.now() };
    try {
      sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
      navigate("/login?from=ask-ai");
    } catch {
      setMessages((current) => [...current, {
        id: `${Date.now()}-storage-error`,
        role: "assistant",
        content: "I couldn't preserve this conversation in your browser. Please copy your question before logging in.",
      }]);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`ask-ai-button ${isOpen ? "ask-ai-button-open" : ""}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close Ask AI chat" : "Open Ask AI chat"}
        aria-expanded={isOpen}
      >
        <span className="ask-ai-icon">{isOpen ? <X size={19} /> : <Sparkles size={19} />}</span>
        <span>{isOpen ? "CLOSE" : "ASK AI"}</span>
        {!isOpen && <span className="ask-ai-pulse" />}
      </button>

      {isOpen && (
        <section className="public-ask-ai-panel" aria-label="Website Ask AI chat">
          <header className="public-ask-ai-header">
            <div className="public-ask-ai-brand-icon"><Sparkles size={18} /></div>
            <div className="public-ask-ai-heading">
              <strong>Ask AI</strong>
              <span><i /> Website assistant</span>
            </div>
            <button type="button" className="public-ask-ai-close" onClick={() => setIsOpen(false)} aria-label="Close chat"><X size={18} /></button>
          </header>

          <div className="public-ask-ai-messages">
            {messages.map((message) => (
              <div key={message.id} className={`public-ask-ai-row ${message.role}`}>
                <div className="public-ask-ai-bubble">{message.content}</div>
                {message.requiresLogin && (
                  <button type="button" className="public-ask-ai-login" onClick={continueAfterLogin}>
                    Login and continue <span>→</span>
                  </button>
                )}
              </div>
            ))}
            {isSending && <div className="public-ask-ai-typing">Thinking…</div>}
            <div ref={endRef} />
          </div>

          <form className="public-ask-ai-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about this website…"
              maxLength={1200}
              aria-label="Ask a question about the website"
              disabled={isSending}
            />
            <button type="submit" aria-label="Send message" disabled={!input.trim() || isSending}><Send size={17} /></button>
          </form>
          <div className="public-ask-ai-note">For personal resume or practice help, log in to continue.</div>
        </section>
      )}
    </>
  );
}
