import React from "react";
import { ReportEntry } from "@/types";
import { FileText, ChevronRight } from "lucide-react";
import { getDownloadUrl } from "@/services/api";

interface HistoryListProps {
  history: ReportEntry[];
  onSelectItem: (entry: ReportEntry) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onSelectItem,
}) => {
  if (!history || history.length === 0) {
    return (
      <p className="text-xs text-slate-500 mt-2">
        Aún no hay reportes generados en esta sesión.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((entry, index) => {
        if (!entry) return null;

        const keyId = entry.id || `history-${index}`;
        const textoSeguro = entry.texto || "Sin directiva";
        const formatoSeguro = entry.formato ? entry.formato.toUpperCase() : "PDF";
        const tiempoSeguro = entry.timestamp || "";

        return (
          <button
            key={keyId}
            type="button"
            onClick={() => {
              if (formatoSeguro === "PDF") {
                window.open(getDownloadUrl(entry.ruta_archivo), "_blank");
              } else {
                onSelectItem(entry);
              }
            }}
            className="w-full text-left bg-panel2 hover:bg-line border border-line hover:border-accent/50 rounded-lg px-3 py-2.5 transition-all duration-200 group cursor-pointer hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-200 truncate group-hover:text-accent transition-colors flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                {textoSeguro.slice(0, 36)}
                {textoSeguro.length > 36 ? "…" : ""}
              </p>
              <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0 bg-panel px-1.5 py-0.5 rounded border border-line">
                {formatoSeguro}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
              <span>{tiempoSeguro}</span>
              <span className="text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                Ver <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
