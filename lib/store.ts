"use client";

import { seedPosts } from "@/lib/seed-data";
import { getSupabaseClient, isLocalDemoMode, isSupabaseConfigured } from "@/lib/supabase";
import type { Comment, CreatePostInput, Post } from "@/lib/types";

const STORAGE_KEY = "ocean-archive-posts-v1";
const DATA_EVENT = "ocean-archive-data";
const MEDIA_DB = "ocean-archive-media";
const MEDIA_STORE = "images";
const MEDIA_PREFIX = "indexeddb://";
const CLOUD_UNAVAILABLE_ERROR = "云端数据库未连接，当前无法公开发布，请联系管理员检查部署配置。";

type PostRow = {
  id: string;
  author: string;
  title: string;
  body: string;
  images: string[] | null;
  likes: number;
  created_at: string;
  text_analysis: string;
  image_analysis: string | null;
  comments?: CommentRow[];
};

type CommentRow = {
  id: string;
  post_id: string;
  author: string;
  body: string;
  created_at: string;
};

function emitChange() {
  window.dispatchEvent(new Event(DATA_EVENT));
}

function readLocalPosts(): Post[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPosts));
    return seedPosts;
  }

  try {
    return JSON.parse(raw) as Post[];
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPosts));
    return seedPosts;
  }
}

function writeLocalPosts(posts: Post[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  emitChange();
}

function openMediaDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(MEDIA_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(MEDIA_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveLocalImage(file: File) {
  const id = crypto.randomUUID();
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(MEDIA_STORE, "readwrite");
    transaction.objectStore(MEDIA_STORE).put(file, id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
  return `${MEDIA_PREFIX}${id}`;
}

async function resolveLocalImage(image: string) {
  if (!image.startsWith(MEDIA_PREFIX)) return image;
  const db = await openMediaDb();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction(MEDIA_STORE).objectStore(MEDIA_STORE).get(image.slice(MEDIA_PREFIX.length));
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return blob ? URL.createObjectURL(blob) : "";
}

async function hydrateLocalPost(post: Post): Promise<Post> {
  const legacyAnalysis = [post.textAnalysis, post.imageAnalysis].filter(Boolean).join(" ");
  return {
    ...post,
    aiAnalysis: post.aiAnalysis || legacyAnalysis || "这篇记录暂时没有 AI 分析。",
    images: (await Promise.all(post.images.map(resolveLocalImage))).filter(Boolean),
  };
}

async function removeLocalImages(images: string[]) {
  const ids = images.filter((image) => image.startsWith(MEDIA_PREFIX)).map((image) => image.slice(MEDIA_PREFIX.length));
  if (!ids.length) return;
  const db = await openMediaDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(MEDIA_STORE, "readwrite");
    ids.forEach((id) => transaction.objectStore(MEDIA_STORE).delete(id));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

function mapRow(row: PostRow): Post {
  return {
    id: row.id,
    author: row.author,
    title: row.title,
    body: row.body,
    images: row.images ?? [],
    likes: row.likes,
    createdAt: row.created_at,
    aiAnalysis: row.text_analysis,
    comments: (row.comments ?? []).map((comment) => ({
      id: comment.id,
      postId: comment.post_id,
      author: comment.author,
      body: comment.body,
      createdAt: comment.created_at,
    })),
  };
}

export async function listPosts(): Promise<Post[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const posts = isLocalDemoMode ? readLocalPosts() : seedPosts;
    return Promise.all(posts.map(hydrateLocalPost));
  }

  const { data, error } = await supabase
    .from("posts")
    .select("*, comments(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as PostRow[]).map(mapRow);
}

export async function getPost(id: string): Promise<Post | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const posts = isLocalDemoMode ? readLocalPosts() : seedPosts;
    const post = posts.find((item) => item.id === id);
    return post ? hydrateLocalPost(post) : null;
  }

  const { data, error } = await supabase
    .from("posts")
    .select("*, comments(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as PostRow) : null;
}

async function uploadImages(files: File[]) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    if (!isLocalDemoMode) throw new Error(CLOUD_UNAVAILABLE_ERROR);
    return Promise.all(files.map(saveLocalImage));
  }

  return Promise.all(
    files.map(async (file) => {
      const extension = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("post-images").upload(path, file);
      if (error) throw error;
      return supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
    }),
  );
}

export async function createPost(
  input: CreatePostInput,
  analyses: { aiAnalysis: string },
): Promise<Post> {
  if (!getSupabaseClient() && !isLocalDemoMode) throw new Error(CLOUD_UNAVAILABLE_ERROR);
  const images = await uploadImages(input.images);
  const now = new Date().toISOString();
  const post: Post = {
    id: crypto.randomUUID(),
    author: input.author,
    title: input.title,
    body: input.body,
    images,
    likes: 0,
    createdAt: now,
    aiAnalysis: analyses.aiAnalysis,
    comments: [],
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    writeLocalPosts([post, ...readLocalPosts()]);
    return hydrateLocalPost(post);
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      id: post.id,
      author: post.author,
      title: post.title,
      body: post.body,
      images: post.images,
      likes: 0,
      text_analysis: post.aiAnalysis,
      image_analysis: null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow({ ...(data as PostRow), comments: [] });
}

export async function toggleLike(id: string) {
  const localPosts = !isSupabaseConfigured ? readLocalPosts() : null;
  if (localPosts) {
    if (!isLocalDemoMode) throw new Error(CLOUD_UNAVAILABLE_ERROR);
    let result: Post | null = null;
    const next = localPosts.map((post) => {
      if (post.id !== id) return post;
      result = {
        ...post,
        liked: !post.liked,
        likes: Math.max(0, post.likes + (post.liked ? -1 : 1)),
      };
      return result;
    });
    writeLocalPosts(next);
    return result ? hydrateLocalPost(result) : null;
  }

  const supabase = getSupabaseClient()!;
  const current = await getPost(id);
  if (!current) return null;
  const { data, error } = await supabase.rpc("increment_post_likes", { target_id: id });
  if (error) throw error;
  return { ...current, likes: typeof data === "number" ? data : current.likes + 1, liked: true };
}

export async function addComment(postId: string, body: string, author = "海上来客") {
  const comment: Comment = {
    id: crypto.randomUUID(),
    postId,
    author,
    body,
    createdAt: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    if (!isLocalDemoMode) throw new Error(CLOUD_UNAVAILABLE_ERROR);
    writeLocalPosts(
      readLocalPosts().map((post) =>
        post.id === postId ? { ...post, comments: [...post.comments, comment] } : post,
      ),
    );
    return comment;
  }

  const { error } = await supabase.from("comments").insert({
    id: comment.id,
    post_id: postId,
    author: comment.author,
    body: comment.body,
  });
  if (error) throw error;
  return comment;
}

export async function deletePost(id: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    if (!isLocalDemoMode) throw new Error(CLOUD_UNAVAILABLE_ERROR);
    const posts = readLocalPosts();
    const target = posts.find((post) => post.id === id);
    if (target) await removeLocalImages(target.images);
    writeLocalPosts(posts.filter((post) => post.id !== id));
    return;
  }

  const response = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error ?? "删除失败");
  }
}

export async function updatePostLikes(id: string, likes: number) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    if (!isLocalDemoMode) throw new Error(CLOUD_UNAVAILABLE_ERROR);
    let updated: Post | null = null;
    writeLocalPosts(
      readLocalPosts().map((post) => {
        if (post.id !== id) return post;
        updated = { ...post, likes };
        return updated;
      }),
    );
    if (!updated) throw new Error("没有找到这篇记录");
    return hydrateLocalPost(updated);
  }

  const response = await fetch(`/api/admin/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ likes }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error ?? "点赞数保存失败");
  return likes;
}

export function subscribeToDataChanges(listener: () => void) {
  window.addEventListener(DATA_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(DATA_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
