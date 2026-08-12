import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin-auth";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const MAX_LIKES = 2_147_483_647;

async function getAdminSupabase() {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return { error: NextResponse.json({ error: "管理员会话已失效" }, { status: 401 }) };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return { error: NextResponse.json({ error: "Supabase 服务端环境变量尚未配置" }, { status: 503 }) };
  }

  return { supabase: createClient(url, serviceKey, { auth: { persistSession: false } }) };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSupabase();
  if (admin.error) return admin.error;

  const payload = await request.json().catch(() => null);
  const likes = payload?.likes;
  if (!Number.isInteger(likes) || likes < 0 || likes > MAX_LIKES) {
    return NextResponse.json({ error: `点赞数必须是 0 到 ${MAX_LIKES} 之间的整数` }, { status: 400 });
  }

  const { id } = await context.params;
  const { data, error } = await admin.supabase
    .from("posts")
    .update({ likes })
    .eq("id", id)
    .select("id, likes")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "没有找到这篇记录" }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSupabase();
  if (admin.error) return admin.error;

  const { id } = await context.params;
  const { error } = await admin.supabase.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
