"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getTranslations, normalizeLocale, type AppLocale } from "./index";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  messages: ReturnType<typeof getTranslations>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LanguageProvider({ children, initialLocale = "ru" }: { children: React.ReactNode; initialLocale?: AppLocale }) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  useEffect(() => {
    const cookieLocale = typeof document !== "undefined"
      ? document.cookie.split("; ").find((item) => item.startsWith("finko-locale="))?.split("=")[1]
      : null;
    const nextLocale = normalizeLocale(cookieLocale ?? initialLocale);
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
  }, [initialLocale]);

  const setLocale = (nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    document.cookie = `finko-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nextLocale;
  };

  const value = useMemo(() => ({
    locale,
    setLocale,
    messages: getTranslations(locale)
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    return {
      locale: "ru" as const,
      setLocale: () => undefined,
      messages: getTranslations("ru")
    };
  }
  return context;
}
