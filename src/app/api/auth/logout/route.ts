import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/server/auth";
import { assertCsrf } from "@/lib/server/security";

export async function POST(request: Request) {
  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const response = NextResponse.json({ authenticated: false });
  clearSessionCookie(response);
  return response;
}
