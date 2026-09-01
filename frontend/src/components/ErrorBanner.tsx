import React from "react";
import { AlertCircle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 flex items-start gap-3 shadow-lg shadow-error/5">
      <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-200">
          No se pudo generar el reporte
        </p>
        <p className="text-sm text-red-300/90 mt-0.5">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-red-300/70 hover:text-red-200 shrink-0 cursor-pointer p-0.5"
        aria-label="Cerrar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
