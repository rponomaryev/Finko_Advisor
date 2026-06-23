"use client";

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/client";
import { getTranslations, type AppLocale } from "@/lib/i18n";

export function NextActionsPanel({ actions, localeOverride }: { actions: string[]; localeOverride?: AppLocale }) {
  const context = useLocale();
  const messages = localeOverride ? getTranslations(localeOverride) : context.messages;
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">{messages.report.nextActions}</h2>
      </CardHeader>
      <CardContent className="grid gap-3">
        {actions.map((action) => (
          <div key={action} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-finko-primary" />
            <span>{action}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
