"use client";

import { AiAnalysis } from "@/components/ai-analysis";
import { Avatar } from "@/components/avatar";
import { PostImages } from "@/components/post-images";
import { formatFullDate, formatRelativeTime } from "@/lib/format";
import { addComment, getPost, toggleLike } from "@/lib/store";
import type { Post } from "@/lib/types";
import { ArrowLeft, Heart, MessageCircle, Send, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setPost(await getPost(params.id));
    setLoading(false);
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  async function like() {
    const next = await toggleLike(params.id);
    if (next) setPost(next);
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    const body = comment.trim();
    if (!body || !post) return;
    setSubmitting(true);
    try {
      const nextComment = await addComment(post.id, body);
      setPost({ ...post, comments: [...post.comments, nextComment] });
      setComment("");
    } finally {
      setSubmitting(false);
    }
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: post?.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  if (loading) return <main className="page-shell detail-shell"><div className="detail-loading" /></main>;
  if (!post) return (
    <main className="page-shell missing-page">
      <span>404</span><h1>这篇航海记录不在档案中</h1><p>它可能已由管理员移除。</p>
      <Link href="/" className="primary-button"><ArrowLeft /> 返回首页</Link>
    </main>
  );

  return (
    <main className="page-shell detail-shell">
      <Link href="/" className="back-link"><ArrowLeft /> 返回故事列表</Link>

      <article className="detail-surface">
        <div className="detail-author-row">
          <Avatar name={post.author} size="lg" />
          <div className="post-author">
            <strong>{post.author}</strong>
            <span title={formatFullDate(post.createdAt)}>{formatRelativeTime(post.createdAt)} · 航海记录</span>
          </div>
        </div>

        <div className="detail-copy">
          <h1>{post.title}</h1>
          <p>{post.body}</p>
        </div>

        <PostImages images={post.images} title={post.title} />

        <div className="detail-actions">
          <button className={post.liked ? "liked" : ""} onClick={like}>
            <Heart fill={post.liked ? "currentColor" : "none"} /> <strong>{post.likes}</strong><span>赞</span>
          </button>
          <a href="#comments"><MessageCircle /> <strong>{post.comments.length}</strong><span>评论</span></a>
          <button onClick={share}><Share2 /><span>{copied ? "链接已复制" : "分享"}</span></button>
        </div>

        <div className="analysis-stack">
          <AiAnalysis hasImages={post.images.length > 0}>{post.aiAnalysis}</AiAnalysis>
        </div>
      </article>

      <section className="comments-surface" id="comments">
        <div className="comments-heading">
          <div><span className="section-kicker">DISCUSSION</span><h2>全部评论</h2></div>
          <span>{post.comments.length}</span>
        </div>
        <div className="comments-list">
          {post.comments.length === 0 && <p className="no-comments">还没有评论，留下第一条回应吧。</p>}
          {post.comments.map((item) => (
            <div className="comment" key={item.id}>
              <Avatar name={item.author} size="sm" />
              <div>
                <div className="comment-meta"><strong>{item.author}</strong><span>{formatRelativeTime(item.createdAt)}</span></div>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <form className="comment-form" onSubmit={submitComment}>
          <Avatar name="海上来客" size="sm" />
          <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="写下你的评论…" maxLength={400} />
          <button type="submit" className="primary-button" disabled={!comment.trim() || submitting}>
            <Send /> <span>{submitting ? "发布中" : "发表评论"}</span>
          </button>
        </form>
      </section>
    </main>
  );
}
