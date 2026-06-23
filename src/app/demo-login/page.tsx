"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { useLocale } from "@/lib/i18n/client";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const parsed = new URL(value, "https://finko.local");
    return parsed.origin === "https://finko.local" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "/";
  } catch {
    return "/";
  }
}

export default function DemoLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { messages } = useLocale();
  const [code, setCode] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = params.get("admin") === "1";
  const next = safeNextPath(params.get("next"));

  useEffect(() => {
    if (isAdmin) return;
    window.location.assign(`/api/auth/demo-login?next=${encodeURIComponent(next)}`);
  }, [isAdmin, next]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch(isAdmin ? "/api/auth/admin-login" : "/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      setSubmitting(false);
      setError(messages.authLogin.error);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-wide text-finko-primaryDark">FINKO demo</p>
          <h1 className="mt-2 text-3xl font-bold">{isAdmin ? messages.authLogin.adminTitle : messages.authLogin.title}</h1>
        </CardHeader>
        <CardContent>
          {!isAdmin ? (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-finko-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {messages.authLogin.userAuto}
            </div>
          ) : (
          <form onSubmit={onSubmit} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">{messages.authLogin.label}</span>
              <Input
                type="password"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder={messages.authLogin.label}
                autoComplete="current-password"
                required
              />
            </label>
            {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <Button type="submit" disabled={isSubmitting || code.trim().length === 0}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {messages.authLogin.button}
            </Button>
          </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
