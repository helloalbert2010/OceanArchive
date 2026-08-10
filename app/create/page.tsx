"use client";

import { createPost } from "@/lib/store";
import type { CreatePostInput } from "@/lib/types";
import { ArrowLeft, ImagePlus, LoaderCircle, Send, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from "react";

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 8 * 1024 * 1024;

async function compressForAnalysis(file: File) {
  const bitmap = await createImageBitmap(file);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("图片压缩失败")), "image/jpeg", 0.78);
  });
}

export default function CreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"idle" | "analyzing" | "saving">("idle");

  const previews = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  function acceptFiles(files: File[]) {
    setError("");
    const valid = files.filter((file) => file.type.startsWith("image/") && file.size <= MAX_FILE_SIZE);
    if (valid.length !== files.length) setError("仅支持单张不超过 8MB 的 JPG、PNG 或 WebP 图片。");
    setImages((current) => [...current, ...valid].slice(0, MAX_IMAGES));
  }

  function chooseImages(event: ChangeEvent<HTMLInputElement>) {
    acceptFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function dropImages(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    acceptFiles(Array.from(event.dataTransfer.files));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !author.trim() || !body.trim()) {
      setError("请填写标题、昵称和故事正文。");
      return;
    }
    setError("");
    setStage("analyzing");
    try {
      const formData = new FormData();
      formData.set("title", title.trim());
      formData.set("body", body.trim());
      if (images.length) {
        const compressed = await Promise.all(images.map(compressForAnalysis));
        compressed.forEach((image, index) => formData.append("images", image, `${images[index].name}.jpg`));
      }

      const response = await fetch("/api/analyze", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "AI 分析暂时不可用");

      setStage("saving");
      const input: CreatePostInput = {
        author: author.trim(),
        title: title.trim(),
        body: body.trim(),
        images,
      };
      const post = await createPost(input, result);
      router.push(`/post/${post.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "发布失败，请稍后重试。");
      setStage("idle");
    }
  }

  const busy = stage !== "idle";

  return (
    <main className="create-page">
      <div className="create-sidebar">
        <Link href="/" className="back-link light"><ArrowLeft /> 返回首页</Link>
        <div className="create-sidebar-copy">
          <span className="section-kicker">NEW LOG</span>
          <h1>分享你在海上<br />看到的变化</h1>
          <p>你的每一段见闻，都可能成为理解海洋变化的重要线索。</p>
        </div>
        <div className="create-promise">
          <Sparkles />
          <div><strong>AI 辅助解读</strong><span>发布后，AI 会为文字生成一段自然、克制的环境观察。</span></div>
        </div>
      </div>

      <div className="create-main">
        <form className="create-form" onSubmit={submit}>
          <div className="form-heading"><span>01</span><div><h2>写下航海故事</h2><p>无需登录，填写完成即可发布。</p></div></div>

          <div className="field-grid">
            <div className="form-field full-field">
              <label htmlFor="story-title">故事标题</label>
              <input id="story-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={60} placeholder="给这段海上见闻一个标题" />
              <span className="character-count">{title.length}/60</span>
            </div>
            <div className="form-field full-field">
              <label htmlFor="story-body">正文</label>
              <textarea id="story-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={8} placeholder="写下你在哪里、看到了什么，以及它给你的感受…" />
              <span className="character-count">{body.length}/2000</span>
            </div>
            <div className="form-field">
              <label htmlFor="story-author">发布人昵称</label>
              <input id="story-author" value={author} onChange={(event) => setAuthor(event.target.value)} maxLength={24} placeholder="例如：WindSailor" />
            </div>
          </div>

          <div className="form-divider" />
          <div className="form-heading"><span>02</span><div><h2>添加航海影像</h2><p>最多 3 张，每张不超过 8MB。</p></div></div>

          <div
            className={`image-dropzone ${dragging ? "dragging" : ""}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={dropImages}
          >
            <input id="image-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={chooseImages} disabled={images.length >= MAX_IMAGES} />
            <ImagePlus />
            <strong>拖放照片到这里</strong>
            <span>或点击选择本地图片</span>
          </div>

          {previews.length > 0 && (
            <div className="upload-previews">
              {previews.map((preview, index) => (
                <div className="upload-preview" key={preview}>
                  <img src={preview} alt={`待上传图片 ${index + 1}`} />
                  <span>{index + 1}</span>
                  <button type="button" aria-label={`移除图片 ${index + 1}`} onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></button>
                </div>
              ))}
            </div>
          )}

          <div className="ai-toggle ai-summary-note">
            <span className="ai-note-icon"><Sparkles /></span>
            <span className="toggle-copy"><strong>AI 综合分析</strong><small>发布后，AI 会结合故事与全部影像生成一条综合评论；没有图片时则基于故事内容分析。</small></span>
          </div>

          {error && <div className="form-error">{error}</div>}
          <div className="form-submit-row">
            <span>发布即表示你同意将这段记录公开分享。</span>
            <button className="primary-button publish-button" type="submit" disabled={busy}>
              {busy ? <LoaderCircle className="spin" /> : <Send />}
              {stage === "analyzing" ? "AI 正在分析" : stage === "saving" ? "正在保存" : "发布航海故事"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
