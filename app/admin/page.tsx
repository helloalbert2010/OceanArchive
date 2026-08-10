"use client";

import { Avatar } from "@/components/avatar";
import { formatRelativeTime } from "@/lib/format";
import { deletePost, listPosts } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { Post } from "@/lib/types";
import { ArrowLeft, Database, LogOut, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [deleting, setDeleting] = useState("");

  useEffect(() => {
    if (window.sessionStorage.getItem("ocean-archive-admin") !== "true") {
      router.replace("/");
      return;
    }
    setAllowed(true);
    listPosts().then(setPosts);
  }, [router]);

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
        <div><span className="section-kicker">ADMIN CONSOLE</span><h1>内容管理</h1><p>查看并移除 OceanArchive 中公开发布的故事。</p></div>
        <div className="admin-stats"><strong>{posts.length}</strong><span>篇公开记录</span></div>
      </div>
      <div className="data-source"><Database /><span>当前数据源</span><strong>{isSupabaseConfigured ? "Supabase 云端数据库" : "本地演示数据库"}</strong></div>
      <div className="admin-list">
        {posts.map((post) => (
          <article className="admin-row" key={post.id}>
            <Avatar name={post.author} />
            <div className="admin-row-copy"><strong>{post.title}</strong><span>{post.author} · {formatRelativeTime(post.createdAt)} · {post.likes} 赞 · {post.comments.length} 评论</span></div>
            <Link href={`/post/${post.id}`} className="admin-view">查看</Link>
            <button className="danger-button" onClick={() => remove(post)} disabled={deleting === post.id}><Trash2 /> {deleting === post.id ? "删除中" : "删除"}</button>
          </article>
        ))}
      </div>
    </main>
  );
}
