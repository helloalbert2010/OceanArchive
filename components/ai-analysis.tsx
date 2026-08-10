import { Bot, ImageIcon, Sparkles } from "lucide-react";

export function AiAnalysis({ type, children }: { type: "text" | "image"; children: string }) {
  return (
    <section className="ai-section">
      <div className="ai-heading">
        <span className="ai-heading-icon">{type === "text" ? <Bot /> : <ImageIcon />}</span>
        <div>
          <strong>AI 分析</strong>
          <span>{type === "text" ? "基于故事文本" : "基于航海影像"}</span>
        </div>
        <span className="ai-badge"><Sparkles /> AI</span>
      </div>
      <p>{children}</p>
    </section>
  );
}
