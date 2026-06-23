import type { Metadata } from "next";
import { cookies } from "next/headers";
import "@/styles/globals.css";
import { FinkoFooter } from "@/components/layout/FinkoFooter";
import { FinkoHeader } from "@/components/layout/FinkoHeader";
import { LanguageProvider } from "@/lib/i18n/client";
import { normalizeLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "FINKO Business Advisor",
  description: "FINKO business advisor for preliminary SME project assessment."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("finko-locale")?.value);

  return (
    <html lang={locale}>
      <body>
        <LanguageProvider initialLocale={locale}>
          <FinkoHeader />
          <main>{children}</main>
          <FinkoFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
