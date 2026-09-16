import { Brain, Sparkles, Mic, FileText, BarChart3 } from "lucide-react";

export default function AIVisual() {
  return (
    <div className="ai-visual">
      <div className="visual-glow glow-one"></div>
      <div className="visual-glow glow-two"></div>

      <div className="orbit orbit-one"></div>
      <div className="orbit orbit-two"></div>
      <div className="orbit orbit-three"></div>

      <div className="ai-core">
        <div className="core-ring">
          <Brain size={54} strokeWidth={1.5} />
        </div>

        <div className="core-spark">
          <Sparkles size={15} />
        </div>
      </div>

      <div className="floating-node node-one">
        <Mic size={18} />
      </div>

      <div className="floating-node node-two">
        <FileText size={18} />
      </div>

      <div className="floating-node node-three">
        <BarChart3 size={18} />
      </div>

      <div className="ai-caption">
        <span className="status-dot"></span>
        AI Interview Engine
      </div>
    </div>
  );
}