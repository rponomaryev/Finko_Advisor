"use client";

import { CheckCircle2, FileText, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useLocale } from "@/lib/i18n/client";

type SectionSummary = {
  id: string;
  name: string;
  status: "completed" | "optional" | "incomplete";
};

export function InterviewCompletePanel({
  canCalculate,
  isCalculating,
  completionPct = 100,
  sections = [],
  onCalculate,
  onReview
}: {
  canCalculate: boolean;
  isCalculating: boolean;
  completionPct?: number;
  sections?: SectionSummary[];
  onCalculate: () => void;
  onReview: () => void;
}) {
  const { messages } = useLocale();
  const completeMessages = messages.interviewComplete;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-finko-primaryLight p-2 text-finko-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-finko-primary">{completionPct}%</p>
            <h2 className="text-xl font-bold">{completeMessages.title}</h2>
            <p className="mt-1 text-sm leading-6 text-finko-muted">{completeMessages.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {sections.length ? (
          <div className="rounded-2xl border border-finko-border bg-white p-4">
            <h3 className="text-sm font-bold">{completeMessages.summaryTitle}</h3>
            <div className="mt-3 grid gap-2">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-semibold text-finko-text">{section.name}</span>
                  <span className="text-xs font-bold text-finko-primary">{completeMessages.statusCompleted}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {messages.interview.optionalCallout}
        </div>

        <div className="rounded-2xl border border-finko-border bg-slate-50 p-4 text-sm leading-6 text-finko-muted">
          <div className="mb-1 flex items-center gap-2 font-bold text-finko-text">
            <ShieldCheck className="h-4 w-4 text-finko-primary" />
            {completeMessages.disclaimerTitle}
          </div>
          {completeMessages.disclaimer}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onCalculate} disabled={isCalculating || !canCalculate}>
            {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {messages.interview.generateReport}
          </Button>
          <Button variant="outline" onClick={onReview}>
            <RotateCcw className="h-4 w-4" />
            {messages.interview.reviewAnswers}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
