import "server-only";

import { NextResponse } from "next/server";
import type { DemoSession } from "./auth";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

// Demo-only in-memory limiter. Use Redis/Upstash or another shared store for multi-instance production.
const buckets = new Map<string, RateLimitBucket>();

type DailyQuotaBucket = { count: number; day: string };
const dailyAiQuotaBuckets = new Map<string, DailyQuotaBucket>();
const DEFAULT_DAILY_AI_LIMIT = 30;

export const rateLimits = {
  auth: { limit: 5, windowMs: 60_000 },
  projectCreate: { limit: 5, windowMs: 60_000 },
  ai: { limit: 10, windowMs: 60_000 },
  export: { limit: 5, windowMs: 60_000 },
  adminUpload: { limit: 3, windowMs: 60_000 },
  adminOperation: { limit: 5, windowMs: 60_000 },
  exchangeRate: { limit: 30, windowMs: 60_000 }
} as const;

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "local";
}

export function rateLimitKey(request: Request, scope: string, session?: DemoSession | null, extra?: string) {
  return [scope, clientIp(request), session?.demoUserId, extra].filter(Boolean).join(":");
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  current.count += 1;
  return null;
}

export function enforceRateLimit(request: Request, scope: keyof typeof rateLimits, session?: DemoSession | null, extra?: string) {
  const config = rateLimits[scope];
  return checkRateLimit(rateLimitKey(request, scope, session, extra), config.limit, config.windowMs);
}

export function checkDailyAIQuota(input: {
  request: Request;
  session?: DemoSession | null;
  projectId?: string;
  limit?: number;
}) {
  const day = new Date().toISOString().slice(0, 10);
  const key = ["ai-day", input.session?.demoUserId ?? clientIp(input.request), input.projectId ?? "global", day].join(":");
  const existing = dailyAiQuotaBuckets.get(key);
  const limit = input.limit ?? DEFAULT_DAILY_AI_LIMIT;

  if (!existing || existing.day !== day) {
    dailyAiQuotaBuckets.set(key, { count: 1, day });
    return null;
  }

  if (existing.count >= limit) {
    return NextResponse.json({ error: "Daily AI request limit exceeded" }, { status: 429 });
  }

  existing.count += 1;
  return null;
}

function expectedOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return new URL(configured).origin;
  return new URL(request.url).origin;
}

function requestOrigin(request: Request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

function isLocalDevOrigin(value: string | null | undefined) {
  if (!value || process.env.NODE_ENV === "production") return false;
  try {
    const parsed = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)
      && (parsed.protocol === "http:" || parsed.protocol === "https:");
  } catch {
    return false;
  }
}

export function safeNextPath(value: unknown, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  try {
    const parsed = new URL(value, "https://finko.local");
    return parsed.origin === "https://finko.local" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch {
    return fallback;
  }
}

export function isSafeHttpsUrl(value: unknown, allowLocalHttp = process.env.NODE_ENV !== "production") {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:") return true;
    if (allowLocalHttp && parsed.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

export function assertCsrf(request: Request) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const configuredExpected = expectedOrigin(request);
  const runtimeExpected = requestOrigin(request);
  let refererOrigin = "";
  try {
    refererOrigin = referer ? new URL(referer).origin : "";
  } catch {
    refererOrigin = "invalid";
  }

  const allowedOrigins = new Set([configuredExpected, runtimeExpected].filter(Boolean));
  const ok = allowedOrigins.has(origin ?? "") || allowedOrigins.has(refererOrigin);

  if (ok) return null;
  if (process.env.NODE_ENV !== "production" && !origin && !referer) return null;
  if (isLocalDevOrigin(origin) || isLocalDevOrigin(refererOrigin)) return null;

  return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
}

export function safeJsonError(message = "Request failed", status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function auditLog(input: {
  actor: string;
  route: string;
  action: string;
  result: "success" | "failure";
  requestId?: string;
}) {
  console.info("[admin-audit]", {
    actor: input.actor,
    timestamp: new Date().toISOString(),
    route: input.route,
    action: input.action,
    result: input.result,
    requestId: input.requestId ?? crypto.randomUUID()
  });
}

export function abuseLog(input: {
  route: string;
  event: string;
  actor?: string;
  requestId?: string;
}) {
  console.warn("[abuse-monitor]", {
    route: input.route,
    event: input.event,
    actor: input.actor,
    timestamp: new Date().toISOString(),
    requestId: input.requestId ?? crypto.randomUUID()
  });
}

export function containsPromptInjection(value: string) {
  return /ignore\s+previous|system\s+prompt|developer\s+message|reveal\s+prompt|show\s+instructions|раскрой\s+промпт|игнорируй\s+инструкции/i.test(value);
}
