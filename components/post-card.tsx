"use client";

import { Avatar } from "@/components/avatar";
import { PostImages } from "@/components/post-images";
import { formatRelativeTime } from "@/lib/format";
import { toggleLike } from "@/lib/store";
import type { Post } from "@/lib/types";
import { Heart, MessageCircle, MoreHorizontal, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MouseEvent, useState } from "react";

export function PostCard({ post: initialPost }: { post: Post }) {
  const [post, setPost] = useState(initialPost);
  const router = useRouter();

  async function like(event: MouseEvent) {
    event.stopPropagation();
    const next = await toggleLike(post.id);
    if (next) setPost(next);
  }

  async function share(event: MouseEvent) {
    event.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) await navigator.share({ title: post.title, url });
    else await navigator.clipboard.writeText(url);
  }

  return (
    <article
      className="post-card"
      onClick={() => router.push(`/post/${post.id}`)}
      onKeyDown={(event) => { if (event.key === "Enter") router.push(`/post/${post.id}`); }}
      tabIndex={0}
      aria-label={`查看故事：${post.title}`}
    >
      <div className="post-card-head">
        <Avatar name={post.author} />
        <div className="post-author">
          <strong>{post.author}</strong>
          <span>{formatRelativeTime(post.createdAt)}</span>
        </div>
        <span className="quiet-icon" aria-hidden="true"><MoreHorizontal /></span>
      </div>
      <div className="post-copy">
        <h2>{post.title}</h2>
        <p>{post.body}</p>
      </div>
      <PostImages images={post.images} title={post.title} />
      <div className="post-actions">
        <button className={post.liked ? "liked" : ""} onClick={like} aria-label="点赞">
          <Heart fill={post.liked ? "currentColor" : "none"} /> <span>{post.likes}</span>
        </button>
        <button onClick={(event) => { event.stopPropagation(); router.push(`/post/${post.id}#comments`); }} aria-label="评论">
          <MessageCircle /> <span>{post.comments.length}</span>
        </button>
        <button onClick={share} aria-label="分享"><Share2 /></button>
      </div>
    </article>
  );
}
