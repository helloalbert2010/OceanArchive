"use client";

import { LockKeyhole, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function Footer() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function login(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError("密码不正确，请重新输入。");
      return;
    }
    window.sessionStorage.setItem("ocean-archive-admin", "true");
    setOpen(false);
    router.push("/admin");
  }

  return (
    <>
      <footer className="site-footer">
        <span>© 2026 OceanArchive</span>
        <span className="footer-dot" />
        <span>记录来自海上的变化</span>
        <button className="footer-admin" onClick={() => setOpen(true)}>
          <LockKeyhole /> 管理员登录
        </button>
      </footer>

      {open && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <div className="login-modal" role="dialog" aria-modal="true" aria-labelledby="admin-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="icon-button modal-close" aria-label="关闭" onClick={() => setOpen(false)}>
              <X />
            </button>
            <div className="modal-icon"><LockKeyhole /></div>
            <h2 id="admin-title">管理员登录</h2>
            <p>登录后可查看并管理全部航海故事。</p>
            <form onSubmit={login}>
              <label htmlFor="admin-password">管理密码</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => { setPassword(event.target.value); setError(""); }}
                autoFocus
                placeholder="输入密码"
              />
              {error && <span className="field-error">{error}</span>}
              <button className="primary-button modal-submit" type="submit">进入管理后台</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
