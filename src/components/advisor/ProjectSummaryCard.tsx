"use client";

import { Lock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { calculateInterviewProgress } from "@/lib/interview/interviewProgress";
import { resolveTemplateForData } from "@/lib/services/templateService";
import type { StructuredProjectData } from "@/lib/types/project";
import { cn } from "@/lib/utils/cn";
import { useLocale } from "@/lib/i18n/client";
import { translateBlock } from "@/lib/i18n/interviewLabels";
import { resolveSidebarSummaryItems } from "@/lib/summary/sidebarSummaryResolver";

export function ProjectSummaryCard({
  profile,
  completionPct,
  activeBlockId,
  navigationDisabled = false,
  onBlockSelect
}: {
  profile: StructuredProjectData;
  mode?: string | null;
  completionPct?: number;
  activeBlockId?: string;
  navigationDisabled?: boolean;
  onBlockSelect?: (blockId: string) => void;
}) {
  const { messages, locale } = useLocale();
  const summaryMessages = messages.projectSummaryCard;
  const template = resolveTemplateForData(profile);
  const summaryItems = resolveSidebarSummaryItems(profile, template, locale);
  const progress = calculateInterviewProgress({ data: profile, template, currentBlockId: activeBlockId, locale });
  const statusByBlockId = new Map(progress.blocks.map((block) => [block.blockId, block] as const));
  const pct = completionPct ?? progress.project.pct;
  const resolvedActiveBlockId = activeBlockId ?? progress.currentBlock?.blockId ?? template.interviewBlocks[0]?.id;
  const lockedTooltip = summaryMessages.lockedTooltip;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{messages.projectSummary}</h2>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs font-semibold text-finko-muted"><span>{summaryMessages.filled}</span><span>{pct}%</span></div>
          <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-finko-primary" style={{ width: `${pct}%` }} /></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 rounded-2xl border border-finko-border bg-slate-50 p-3">
          <h3 className="text-sm font-bold">{summaryMessages.sections}</h3>
          <div className="grid gap-2">
            {template.interviewBlocks.map((block, index) => {
              const status = statusByBlockId.get(block.id);
              const blockCopy = translateBlock(locale, block.id, block.name, block.description);
              const isActive = resolvedActiveBlockId === block.id;
              const locked = status?.status === "locked";
              const needsReview = status?.status === "needs_review" || status?.status === "has_warnings";
              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => { if (!locked && !navigationDisabled) onBlockSelect?.(block.id); }}
                  disabled={locked || navigationDisabled}
                  title={locked ? lockedTooltip : undefined}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm transition",
                    isActive ? "border-finko-primary bg-finko-primaryLight text-finko-primaryDark" : "border-finko-border bg-white hover:border-finko-primary/50 hover:text-finko-primary",
                    (locked || navigationDisabled) && "cursor-not-allowed opacity-55 hover:border-finko-border hover:text-finko-text"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{blockCopy.name}</span>
                    {needsReview ? <span className="block text-xs font-medium text-amber-700">{status?.label}</span> : null}
                    {status?.warnings?.length ? (
                      <span className="mt-1 block text-xs font-normal text-amber-800">
                        {status.warnings.slice(0, 2).map((warning) => warning.message).join("; ")}
                      </span>
                    ) : null}
                  </span>
                  <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", status?.status === "filled" ? "bg-emerald-50 text-emerald-700" : locked ? "bg-slate-100 text-slate-500" : status?.status === "has_warnings" || status?.status === "needs_review" ? "bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-600")}>
                    {locked ? <Lock className="h-3 w-3" /> : null}
                    {locked ? status?.label : status?.label ?? "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {summaryItems.map((item) => {
            const label = summaryMessages.fields[item.key] ?? item.label;
            return (
              <div key={`${item.key}:${item.rawKey ?? item.key}`} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 text-sm last:border-0">
                <span className="text-finko-muted">{label}</span>
                <span className="max-w-[58%] overflow-safe text-right font-semibold tabular-nums">
                  {item.displayValue}
                </span>
              </div>
            );
          })}
        </div>
        {progress.project.missing > 0 || progress.dataQualityStatus !== "ok" ? (
          <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">{messages.interview.incomplete}</div>
        ) : (
          <div className="mt-4 rounded-2xl bg-finko-primaryLight p-3 text-sm text-finko-primaryDark">{messages.interview.completedDescription}</div>
        )}
      </CardContent>
    </Card>
  );
}
