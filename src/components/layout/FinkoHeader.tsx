"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/client";
import type { AppLocale } from "@/lib/i18n";

const localeLabels: Array<{ locale: AppLocale; label: string; flag: string; alt: string }> = [
  { locale: "uz", label: "O'zbekcha", flag: "/flags/uz.svg", alt: "O'zbekiston bayrog'i" },
  { locale: "ru", label: "Русский", flag: "/flags/ru.svg", alt: "Флаг России" },
  { locale: "en", label: "English", flag: "/flags/gb.svg", alt: "United Kingdom flag" }
];

export function FinkoHeader() {
  const { locale, setLocale, messages } = useLocale();
  const [languageOpen, setLanguageOpen] = useState(false);
  const currentLocale = localeLabels.find((item) => item.locale === locale) ?? localeLabels[0];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-finko-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/finko-logo.png" alt="FINKO" width={180} height={66} priority className="h-12 w-auto object-contain sm:h-14" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-finko-text lg:flex">
          {messages.header.nav.map((item, index) => (
            <Link key={item} href={index === 0 ? "/" : "#"} className="transition hover:text-finko-primary">
              {item}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setLanguageOpen((value) => !value)}
              className="flex items-center gap-2 rounded-full border border-finko-border bg-white px-3 py-2 text-sm font-bold text-finko-text shadow-sm transition hover:border-finko-primary"
              aria-expanded={languageOpen}
            >
              <Image src={currentLocale.flag} alt={currentLocale.alt} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
              <span>{currentLocale.label}</span>
              <ChevronDown className="h-4 w-4 text-finko-muted" />
            </button>
            {languageOpen ? (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-finko-border bg-white p-2 shadow-finko">
                {localeLabels.map((item) => (
                  <button
                    key={item.locale}
                    type="button"
                    onClick={() => {
                      setLocale(item.locale);
                      setLanguageOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                      locale === item.locale ? "bg-finko-primary text-white" : "text-finko-text hover:bg-finko-primaryLight hover:text-finko-primary"
                    }`}
                    aria-pressed={locale === item.locale}
                  >
                    <Image src={item.flag} alt={item.alt} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1 sm:hidden">
            {localeLabels.map((item) => (
              <button
                key={item.locale}
                type="button"
                onClick={() => setLocale(item.locale)}
                className={`rounded-full p-1 transition ${
                  locale === item.locale ? "bg-finko-primary text-white" : "text-finko-muted hover:text-finko-primary"
                }`}
                aria-pressed={locale === item.locale}
                title={item.label}
              >
                <Image src={item.flag} alt={item.alt} width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
              </button>
            ))}
          </div>
          <Link href="/advisor/new">
            <Button>
              <LogIn className="h-4 w-4" />
              {messages.header.login}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
