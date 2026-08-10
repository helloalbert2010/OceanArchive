import Link from "next/link";
import { SquarePen } from "lucide-react";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <span className="hero-kicker">来自海上的第一手观察</span>
        <h1>在这里分享你的<br />航海故事</h1>
        <p>每一次出海，都是一份关于地球的现场记录。</p>
        <Link href="/create" className="hero-button"><SquarePen /> 分享你的故事</Link>
      </div>
      <div className="hero-note"><span>30</span> 篇海上记录正在汇聚</div>
    </section>
  );
}
