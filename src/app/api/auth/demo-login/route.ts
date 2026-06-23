import { NextResponse } from "next/server";
import { assertCsrf, enforceRateLimit } from "@/lib/server/security";
import { createSignedSession, setSessionCookie, verifyAccessCode } from "@/lib/server/auth";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/advisor/new";
  try {
    const parsed = new URL(value, "https://finko.local");
    return parsed.origin === "https://finko.local" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "/advisor/new";
  } catch {
    return "/advisor/new";
  }
}

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "auth");
  if (limited) return limited;

  const next = safeNextPath(new URL(request.url).searchParams.get("next"));
  const demoUserId = `demo-user-${crypto.randomUUID()}`;
  const { value } = createSignedSession("user", demoUserId);
  const response = NextResponse.redirect(new URL(next, request.url));
  setSessionCookie(response, value);
  return response;
}

export async function POST(request: Request) {
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const limited = enforceRateLimit(request, "auth");
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const demoUserId = verifyAccessCode("user", body.code);
  if (!demoUserId) {
    return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
  }

  const { value } = createSignedSession("user", demoUserId);
  const response = NextResponse.json({ authenticated: true, role: "user" });
  setSessionCookie(response, value);
  return response;
}
