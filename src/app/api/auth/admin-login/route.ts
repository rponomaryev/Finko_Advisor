import { NextResponse } from "next/server";
import { assertCsrf, enforceRateLimit } from "@/lib/server/security";
import { createSignedSession, setSessionCookie, verifyAccessCode } from "@/lib/server/auth";

export async function POST(request: Request) {
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const limited = enforceRateLimit(request, "auth");
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const demoUserId = verifyAccessCode("admin", body.code);
  if (!demoUserId) {
    return NextResponse.json({ error: "Invalid access code" }, { status: 401 });
  }

  const { value } = createSignedSession("admin", demoUserId);
  const response = NextResponse.json({ authenticated: true, role: "admin" });
  setSessionCookie(response, value);
  return response;
}
