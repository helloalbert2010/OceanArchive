import { Bot, Sparkles } from "lucide-react";

export function AiAnalysis({ hasImages, children }: { hasImages: boolean; children: string }) {
  return (
    <section className="ai-section">
      <div className="ai-heading">
        <span className="ai-heading-icon"><Bot /></span>
        <div>
          <strong>AI 分析</strong>
          <span>{hasImages ? "综合故事与航海影像" : "基于故事内容"}</span>
        </div>
        <span className="ai-badge"><Sparkles /> AI</span>
      </div>
      <p>{children}</p>
    </section>
  );
}
