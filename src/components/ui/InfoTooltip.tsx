"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function InfoTooltip({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className={cn("relative inline-flex items-center", className)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label="Info"
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-finko-muted transition hover:bg-finko-primaryLight hover:text-finko-primary"
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
      >
        <CircleHelp className="h-4 w-4" />
      </button>
      {open ? (
        <span className="absolute left-1/2 top-7 z-30 w-72 -translate-x-1/2 rounded-xl border border-finko-border bg-white p-3 text-left text-xs font-normal leading-5 text-finko-text shadow-finko">
          {text}
        </span>
      ) : null}
    </span>
  );
}
