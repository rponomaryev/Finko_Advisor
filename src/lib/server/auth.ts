import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export type DemoRole = "user" | "admin";

export type DemoSession = {
  role: DemoRole;
  demoUserId: string;
  issuedAt: string;
  expiresAt: string;
};

export const DEMO_SESSION_COOKIE = "finko_demo_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sessionSecret() {
  const secret = process.env.DEMO_SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "dev-only-finko-demo-session-secret";
  return "";
}

function configuredToken(role: DemoRole) {
  const envValue = role === "admin" ? process.env.DEMO_ADMIN_TOKEN : process.env.DEMO_USER_TOKEN;
  if (envValue) return envValue;
  if (process.env.NODE_ENV !== "production") return role === "admin" ? "admin-demo" : "demo";
  return "";
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function signPayload(encodedPayload: string) {
  const secret = sessionSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function tokenUserId(role: DemoRole, code: string) {
  const digest = crypto.createHash("sha256").update(`${role}:${code}`).digest("hex").slice(0, 16);
  return `demo-${role}-${digest}`;
}

export function verifyAccessCode(role: DemoRole, code: unknown) {
  if (typeof code !== "string" || !code.trim()) return null;
  const expected = configuredToken(role);
  if (!expected || !safeEqual(code.trim(), expected)) return null;
  return tokenUserId(role, expected);
}

export function createSignedSession(role: DemoRole, demoUserId: string): { session: DemoSession; value: string } {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
  const session: DemoSession = {
    role,
    demoUserId,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(session));
  const signature = signPayload(encodedPayload);
  if (!signature) {
    throw new Error("DEMO_SESSION_SECRET is required in production.");
  }
  return { session, value: `${encodedPayload}.${signature}` };
}

export function parseSignedSession(value?: string | null): DemoSession | null {
  if (!value) return null;
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = signPayload(encodedPayload);
  if (!expected || !safeEqual(signature, expected)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as DemoSession;
    if (parsed.role !== "user" && parsed.role !== "admin") return null;
    if (!parsed.demoUserId || !parsed.expiresAt) return null;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function bearerSession(request: Request): DemoSession | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  for (const role of ["user", "admin"] as const) {
    const expected = configuredToken(role);
    if (expected && safeEqual(token, expected)) {
      const { session } = createSignedSession(role, tokenUserId(role, expected));
      return session;
    }
  }
  return null;
}

export function getRequestSession(request: Request): DemoSession | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieValue = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${DEMO_SESSION_COOKIE}=`))
    ?.slice(DEMO_SESSION_COOKIE.length + 1);
  return parseSignedSession(cookieValue) ?? bearerSession(request);
}

export async function getServerSession(): Promise<DemoSession | null> {
  const store = await cookies();
  return parseSignedSession(store.get(DEMO_SESSION_COOKIE)?.value);
}

export function setSessionCookie(response: NextResponse, value: string) {
  response.cookies.set(DEMO_SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(DEMO_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Authentication required" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function requireSession(request: Request): DemoSession | NextResponse {
  return getRequestSession(request) ?? unauthorizedResponse();
}

export function requireUserSession(request: Request): DemoSession | NextResponse {
  const session = getRequestSession(request);
  if (!session) return unauthorizedResponse();
  return session.role === "user" ? session : forbiddenResponse();
}

export function requireAdminSession(request: Request): DemoSession | NextResponse {
  const session = getRequestSession(request);
  if (!session) return unauthorizedResponse();
  return session.role === "admin" ? session : forbiddenResponse();
}

export function isAuthResponse(value: DemoSession | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export function middlewareHasSession(request: NextRequest) {
  return Boolean(request.cookies.get(DEMO_SESSION_COOKIE)?.value);
}
