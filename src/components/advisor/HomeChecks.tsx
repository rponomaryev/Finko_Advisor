"use client";

import { useLocale } from "@/lib/i18n/client";

export function HomeChecks() {
  const { messages } = useLocale();
  return (
    <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-finko border border-finko-border bg-white p-6 shadow-finko">
        <h2 className="text-2xl font-bold">{messages.homeChecks.title}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="font-semibold">{messages.homeChecks.financeTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-finko-muted">{messages.homeChecks.financeText}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <h3 className="font-semibold">{messages.homeChecks.riskTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-finko-muted">{messages.homeChecks.riskText}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
