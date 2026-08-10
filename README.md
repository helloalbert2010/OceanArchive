# OceanArchive

面向青年帆船水手的海洋观察分享平台。项目包含公开故事流、独立详情页、评论与点赞、最多三张图片的发布流程、GLM 文本/图片分析，以及单一管理员删除入口。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。未配置 Supabase 时会使用浏览器本地存储，并自动生成 30 条演示记录。

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写所需配置。GLM API 仅由 `app/api/analyze` 服务端路由调用，不会下发到浏览器。管理员默认密码为 `admin123`，可以通过 `ADMIN_PASSWORD` 修改。

## Supabase

1. 在 Supabase 新建项目。
2. 在 SQL Editor 运行 `supabase/migrations/001_schema.sql`。
3. 运行 `supabase/seed.sql` 写入 30 条故事与评论。
4. 将项目 URL、anon key 和 service role key 填入 `.env.local`。
5. 重启开发服务器。

Supabase 匿名访问策略允许阅读、发布、点赞与评论，不允许删除。删除请求必须通过管理员会话和服务端 service role key。
