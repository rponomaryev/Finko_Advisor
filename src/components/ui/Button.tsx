import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  children: ReactNode;
};

const variants = {
  primary: "bg-finko-primary text-white hover:bg-finko-primaryDark shadow-sm",
  secondary: "bg-finko-black text-white hover:bg-zinc-800 shadow-sm",
  outline: "border border-finko-border bg-white text-finko-text hover:border-finko-primary hover:text-finko-primary",
  ghost: "text-finko-muted hover:bg-finko-primaryLight hover:text-finko-primaryDark"
};

export function Button({ className, variant = "primary", children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-finko-button px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
