import * as React from "react";
import { cn } from "@/lib/utils";

const variantStyles: Record<string, string> = {
  default: "bg-accent/15 text-accent border-accent/30",
  success: "bg-ok/15 text-ok border-ok/30",
  error: "bg-error/15 text-error border-error/30",
  warning: "bg-warn/15 text-warn border-warn/30",
  outline: "bg-transparent text-slate-400 border-line",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantStyles;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
