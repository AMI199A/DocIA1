import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateReport } from "@/services/api";
import { DocumentRequest, DocumentResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Zap, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ReportFormProps {
  onSuccess: (data: DocumentResponse, request: DocumentRequest) => void;
  onError: (errorMsg: string) => void;
  simulateFailure: boolean;
  onToggleSimulateFailure: (val: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

const SUSPICIOUS_PATTERNS = [
  /<\s*script/i,
  /<\s*iframe/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*["']/i,
  /\{\{.*\}\}/,
  /\$\{.*\}/,
  /<\s*\/?\s*(img|svg|object|embed)\b/i,
];

function validateInput(value: string): { valid: boolean; reason?: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      valid: false,
      reason: "Escribe una directiva antes de generar el reporte.",
    };
  }
  if (trimmed.length < 8) {
    return {
      valid: false,
      reason:
        "La directiva es muy corta. Describe con más detalle qué reporte necesitas.",
    };
  }
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        reason:
          "El texto contiene caracteres o etiquetas no permitidas. Elimina cualquier código o marcado.",
      };
    }
  }
  return { valid: true };
}

export const ReportForm: React.FC<ReportFormProps> = ({
  onSuccess,
  onError,
  simulateFailure,
  onToggleSimulateFailure,
  isProcessing,
  setIsProcessing,
}) => {
  const [texto, setTexto] = useState("");
  const [formato, setFormato] = useState<"pdf" | "docx">("pdf");
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (req: DocumentRequest) => {
      setIsProcessing(true);
      if (simulateFailure) {
        await new Promise((res) => setTimeout(res, 1200));
        throw new Error(
          "Tiempo de espera agotado: no se pudo conectar con el servicio de Ollama. (Simulacro de falla activado)"
        );
      }
      return await generateReport(req);
    },
    onSuccess: (data, req) => {
      setIsProcessing(false);
      onSuccess(data, req);
      setTexto("");
      toast.success("Reporte generado exitosamente", {
        description: `Archivo ${req.formato.toUpperCase()} creado en el servidor.`,
      });
    },
    onError: (err: Error) => {
      setIsProcessing(false);
      const msg = err.message || "Ocurrió un error al procesar el reporte.";
      onError(msg);
      toast.error("Error al generar reporte", { description: msg });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const validation = validateInput(texto);
    if (!validation.valid) {
      setValidationError(validation.reason || "Entrada inválida.");
      toast.error("Validación fallida", {
        description: validation.reason,
      });
      return;
    }

    mutation.mutate({ texto, formato });
  };

  return (
    <section className="bg-panel border border-line rounded-xl p-5 lg:p-6 shadow-xl">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-3">
          <label htmlFor="reportInput" className="text-sm font-semibold text-white">
            Directiva del reporte
          </label>
          <span className="text-xs font-mono text-slate-500">
            {texto.length} caracteres
          </span>
        </div>

        <Textarea
          id="reportInput"
          rows={5}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            if (validationError) setValidationError(null);
          }}
          disabled={isProcessing}
          placeholder="Ej: Genera un reporte ejecutivo sobre el desempeño de ventas del tercer trimestre..."
          className={validationError ? "border-error focus:ring-error" : ""}
        />

        {validationError ? (
          <p className="text-xs text-error mt-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {validationError}
          </p>
        ) : (
          <p className="text-xs text-slate-500 mt-2">
            La entrada se valida antes de enviarse: sin campos vacíos ni marcado/scripts incrustados.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400">Formato de salida</label>
            <Select
              value={formato}
              onValueChange={(val) => setFormato(val as "pdf" | "docx")}
              disabled={isProcessing}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                <SelectItem value="docx">DOCX (.docx)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={isProcessing || !texto.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando informe mediante Ollama...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Generar reporte</span>
              </>
            )}
          </Button>
        </div>

        {/* Failure Simulation Switch */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-line">
          <div>
            <p className="text-xs font-medium text-slate-300">
              Simular falla de API
            </p>
            <p className="text-[11px] text-slate-500">
              Para demostración: bloquea la petición real y fuerza un error de servicio caído.
            </p>
          </div>
          <Switch
            checked={simulateFailure}
            onCheckedChange={onToggleSimulateFailure}
          />
        </div>
      </form>
    </section>
  );
};