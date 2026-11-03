import React from "react";
import { ReportEntry } from "@/types";
import { getDownloadUrl } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle2, FileCode } from "lucide-react";
import { toast } from "sonner";

interface ReportViewerProps {
  entry: ReportEntry | null;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ entry }) => {
  if (!entry) {
    return (
      <section className="bg-panel border border-line rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[260px]">
        <FileCode className="w-12 h-12 text-slate-600 mb-3 stroke-[1.5]" />
        <h3 className="text-sm font-semibold text-slate-400">
          No hay ningún reporte visualizado
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Completa la directiva y haz clic en "Generar reporte" para obtener el resumen redactado por la IA.
        </p>
      </section>
    );
  }

  const downloadUrl = getDownloadUrl(entry.ruta_archivo);

  const handleDownload = () => {
    toast.info("Descargando reporte...", {
      description: `Formato: ${entry.formato.toUpperCase()}`,
    });
  };

  return (
    <section className="bg-panel border border-line rounded-xl p-5 lg:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <FileCode className="w-4 h-4 text-accent" />
          Reporte generado
        </h2>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-ok bg-ok/10 border border-ok/30 px-2.5 py-0.5 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completado
        </span>
      </div>

      <div className="bg-panel2 border border-line rounded-lg p-4 font-mono text-xs text-slate-200 leading-relaxed max-h-96 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
        {entry.contenido_ia}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <span className="text-xs font-mono text-slate-500 truncate max-w-xs sm:max-w-md">
          {entry.ruta_archivo}
        </span>

        <Button variant="success" size="sm" asChild>
          <a
            href={downloadUrl}
            download
            target="_blank"
            rel="noreferrer"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar reporte ({entry.formato.toUpperCase()})</span>
          </a>
        </Button>
      </div>
    </section>
  );
};