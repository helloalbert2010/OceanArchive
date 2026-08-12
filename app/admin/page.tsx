"use client";

import { Avatar } from "@/components/avatar";
import { formatRelativeTime } from "@/lib/format";
import { deletePost, listPosts, updatePostLikes } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Post } from "@/lib/types";
import { ArrowLeft, Check, Database, Heart, LoaderCircle, LogOut, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [deleting, setDeleting] = useState("");
  const [likeValues, setLikeValues] = useState<Record<string, string>>({});
  const [savingLikes, setSavingLikes] = useState("");
  const [likeStatus, setLikeStatus] = useState<Record<string, { type: "success" | "error"; message: string }>>({});

  useEffect(() => {
    if (window.sessionStorage.getItem("ocean-archive-admin") !== "true") {
      router.replace("/");
      return;
    }
    setAllowed(true);
    listPosts().then((items) => {
      setPosts(items);
      setLikeValues(Object.fromEntries(items.map((post) => [post.id, String(post.likes)])));
    });
  }, [router]);

  async function saveLikes(post: Post) {
    const rawValue = likeValues[post.id] ?? String(post.likes);
    const likes = Number(rawValue);
    if (!Number.isInteger(likes) || likes < 0 || likes > 2_147_483_647) {
      setLikeStatus((current) => ({
        ...current,
        [post.id]: { type: "error", message: "请输入 0 到 2147483647 之间的整数" },
      }));
      return;
    }

    setSavingLikes(post.id);
    setLikeStatus((current) => {
      const next = { ...current };
      delete next[post.id];
      return next;
    });
    try {
      await updatePostLikes(post.id, likes);
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, likes } : item));
      setLikeValues((current) => ({ ...current, [post.id]: String(likes) }));
      setLikeStatus((current) => ({
        ...current,
        [post.id]: { type: "success", message: "已保存" },
      }));
    } catch (cause) {
      setLikeStatus((current) => ({
        ...current,
        [post.id]: { type: "error", message: cause instanceof Error ? cause.message : "保存失败" },
      }));
    } finally {
      setSavingLikes("");
    }
  }

  async function remove(post: Post) {
    if (!window.confirm(`确定删除《${post.title}》吗？此操作无法撤销。`)) return;
    setDeleting(post.id);
    try {
      await deletePost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } finally {
      setDeleting("");
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.sessionStorage.removeItem("ocean-archive-admin");
    router.push("/");
  }

  if (!allowed) return null;

  return (
    <main className="page-shell admin-shell">
      <div className="admin-topbar">
        <Link href="/" className="back-link"><ArrowLeft /> 返回首页</Link>
        <button className="secondary-button" onClick={logout}><LogOut /> 退出管理</button>
      </div>
      <div className="admin-heading">
        <div><span className="section-kicker">ADMIN CONSOLE</span><h1>内容管理</h1><p>查看故事、调整点赞数量或移除公开记录。</p></div>
        <div className="admin-stats"><strong>{posts.length}</strong><span>篇公开记录</span></div>
      </div>
      <div className="data-source"><Database /><span>当前数据源</span><strong>{isSupabaseConfigured ? "Supabase 云端数据库" : "本地演示数据库"}</strong></div>
      <div className="admin-list">
        {posts.map((post) => (
          <article className="admin-row" key={post.id}>
            <Avatar name={post.author} />
            <div className="admin-row-copy"><strong>{post.title}</strong><span>{post.author} · {formatRelativeTime(post.createdAt)} · {post.likes} 赞 · {post.comments.length} 评论</span></div>
            <div className="admin-like-editor">
              <label htmlFor={`likes-${post.id}`}><Heart /> 点赞数</label>
              <div>
                <input
                  id={`likes-${post.id}`}
                  type="number"
                  min="0"
                  max="2147483647"
                  step="1"
                  inputMode="numeric"
                  value={likeValues[post.id] ?? String(post.likes)}
                  onChange={(event) => {
                    setLikeValues((current) => ({ ...current, [post.id]: event.target.value }));
                    setLikeStatus((current) => {
                      const next = { ...current };
                      delete next[post.id];
                      return next;
                    });
                  }}
                  onKeyDown={(event) => { if (event.key === "Enter") saveLikes(post); }}
                  disabled={savingLikes === post.id}
                  aria-describedby={likeStatus[post.id] ? `likes-status-${post.id}` : undefined}
                />
                <button
                  type="button"
                  className="secondary-button admin-like-save"
                  onClick={() => saveLikes(post)}
                  disabled={savingLikes === post.id || likeValues[post.id] === String(post.likes)}
                >
                  {savingLikes === post.id ? <LoaderCircle className="spin" /> : <Save />}
                  <span>{savingLikes === post.id ? "保存中" : "保存"}</span>
                </button>
              </div>
              {likeStatus[post.id] && (
                <span id={`likes-status-${post.id}`} className={`admin-like-status ${likeStatus[post.id].type}`}>
                  {likeStatus[post.id].type === "success" && <Check />}
                  {likeStatus[post.id].message}
                </span>
              )}
            </div>
            <Link href={`/post/${post.id}`} className="admin-view">查看</Link>
            <button className="danger-button" onClick={() => remove(post)} disabled={deleting === post.id}><Trash2 /> {deleting === post.id ? "删除中" : "删除"}</button>
          </article>
        ))}
      </div>
    </main>
  );
}
