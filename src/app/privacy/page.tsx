import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { getTranslations, normalizeLocale } from "@/lib/i18n";

function safeReturnPath(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/advisor/new";
  try {
    const parsed = new URL(raw, "https://finko.local");
    return parsed.origin === "https://finko.local" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "/advisor/new";
  } catch {
    return "/advisor/new";
  }
}

export default async function PrivacyPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("finko-locale")?.value);
  const messages = getTranslations(locale);
  const backHref = safeReturnPath(params?.from);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-finko-border bg-white p-6 shadow-finko sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-finko-primaryDark">FINKO</p>
            <h1 className="mt-2 text-3xl font-bold text-finko-text">{messages.privacy.title}</h1>
            <p className="mt-4 text-sm leading-7 text-finko-muted">{messages.privacy.lead}</p>
          </div>
          <Link
            href={backHref}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-finko-border bg-white px-4 py-2.5 text-sm font-bold text-finko-primary shadow-sm transition hover:border-finko-primary hover:bg-finko-primaryLight"
          >
            <ArrowLeft className="h-4 w-4" />
            {messages.privacy.backToForm}
          </Link>
        </div>

        <div className="mt-8 grid gap-4">
          {messages.privacy.items.map((item) => (
            <article key={item.title} className="rounded-2xl border border-finko-border bg-slate-50 p-4">
              <h2 className="text-base font-bold text-finko-text">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-finko-muted">{item.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
          {messages.privacy.note}
        </div>
      </div>
    </section>
  );
}
