"use client";

import { useLocale } from "@/lib/i18n/client";
import { getLocalizedDisclaimer } from "@/lib/report/disclaimer";

export function FinkoFooter() {
  const { locale, messages } = useLocale();
  return (
    <footer className="mt-16 border-t border-finko-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-finko-muted sm:px-6 lg:grid-cols-[1fr_2fr] lg:px-8">
        <div>
          <p className="font-semibold text-finko-text">FINKO Business Advisor</p>
          <p className="mt-2">{messages.footer.description}</p>
        </div>
        <p>{getLocalizedDisclaimer(locale)}</p>
      </div>
    </footer>
  );
}
