import React from "react";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  label: string;
  isOnline: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  label,
  isOnline,
  className,
}) => {
  return (
    <div className={cn("flex items-center justify-between text-xs", className)}>
      <span className="text-slate-300">{label}</span>
      <span
        className={cn(
          "flex items-center gap-1.5 font-mono text-xs transition-colors",
          isOnline ? "text-ok" : "text-error"
        )}
      >
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors",
            isOnline ? "bg-ok animate-pulse-dot" : "bg-error"
          )}
        />
        {isOnline ? "Activo" : "Inactivo"}
      </span>
    </div>
  );
};
