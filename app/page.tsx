"use client";

import { FeedLoading } from "@/components/loading";
import { Hero } from "@/components/hero";
import { PostCard } from "@/components/post-card";
import { listPosts, subscribeToDataChanges } from "@/lib/store";
import type { Post } from "@/lib/types";
import { Anchor, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [visible, setVisible] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setPosts(await listPosts());
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "内容载入失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return subscribeToDataChanges(load);
  }, [load]);

  return (
    <main className="page-shell home-shell">
      <Hero postCount={posts.length} loading={loading} />
      <div className="feed-heading">
        <div>
          <span className="section-kicker">LATEST LOGS</span>
          <h2>最新航海记录</h2>
        </div>
        <span className="feed-count"><Anchor /> {posts.length} 篇故事</span>
      </div>
      {loading ? <FeedLoading /> : error ? (
        <div className="state-panel"><strong>暂时无法载入故事</strong><p>{error}</p><button onClick={load}>重新加载</button></div>
      ) : (
        <div className="feed-list">
          {posts.slice(0, visible).map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
      {visible < posts.length && (
        <button className="load-more" onClick={() => setVisible((value) => value + 8)}>
          查看更多记录 <ChevronDown />
        </button>
      )}
    </main>
  );
}
