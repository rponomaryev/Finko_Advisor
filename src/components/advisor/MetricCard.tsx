import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/Card";

export function MetricCard({ title, value, caption, icon }: { title: string; value: ReactNode; caption?: string; icon?: ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-finko-muted">{title}</p>
          <div className="mt-2 whitespace-nowrap text-[1.35rem] font-bold leading-tight tracking-tight text-finko-text tabular-nums sm:text-2xl">{value}</div>
          {caption ? <p className="mt-2 break-words text-xs leading-5 text-finko-muted">{caption}</p> : null}
        </div>
        {icon ? <div className="shrink-0 rounded-xl bg-finko-primaryLight p-2 text-finko-primaryDark">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
