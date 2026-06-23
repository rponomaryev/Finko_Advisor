"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/client";
import { getScoreColorVariant, getScoreLabel } from "@/lib/scoring/scoringService";

export function ScoreCard({ title, score, caption }: { title: string; score: number; caption: string }) {
  const { locale } = useLocale();
  const variant = getScoreColorVariant(score);

  return (
    <Card className="shadow-sm">
      <CardContent>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-finko-muted">{title}</p>
          <Badge variant={variant === "green" ? "green" : variant === "amber" ? "amber" : "red"}>
            {getScoreLabel(score, locale)}
          </Badge>
        </div>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-5xl font-bold">{score}</span>
          <span className="pb-2 text-sm font-semibold text-finko-muted">/100</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-finko-primary" style={{ width: `${score}%` }} />
        </div>
        <p className="mt-3 text-sm leading-6 text-finko-muted">{caption}</p>
      </CardContent>
    </Card>
  );
}
