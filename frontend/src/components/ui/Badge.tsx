import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "error";
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variant === "default" && "bg-slate-100 text-slate-700",
        variant === "success" && "bg-green-50 text-green-700",
        variant === "warning" && "bg-amber-50 text-amber-700",
        variant === "error" && "bg-red-50 text-red-700",
        className,
      )}
    >
      {children}
    </span>
  );
}
