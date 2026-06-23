import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const variants = {
  green: "bg-finko-success/10 text-finko-success",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-finko-primaryLight text-finko-primaryDark",
  blue: "bg-blue-100 text-blue-700",
  neutral: "bg-slate-100 text-slate-700",
  black: "bg-finko-black text-white"
};

export function Badge({
  className,
  variant = "neutral",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
  children: ReactNode;
}) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
