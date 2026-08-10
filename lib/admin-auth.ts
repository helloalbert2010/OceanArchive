import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "ocean-archive-admin";

function sessionToken() {
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const secret = process.env.ADMIN_SESSION_SECRET ?? "ocean-archive-local-session";
  return createHash("sha256").update(`${password}:${secret}`).digest("hex");
}

export function isValidAdminToken(value?: string) {
  if (!value) return false;
  const expected = Buffer.from(sessionToken());
  const received = Buffer.from(value);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function getAdminToken() {
  return sessionToken();
}
