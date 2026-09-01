import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ProcessingStripProps {
  isProcessing: boolean;
}

export const ProcessingStrip: React.FC<ProcessingStripProps> = ({
  isProcessing,
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isProcessing) {
      setSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => +(prev + 0.1).toFixed(1));
    }, 100);

    return () => clearInterval(interval);
  }, [isProcessing]);

  if (!isProcessing) return null;

  return (
    <div className="bg-panel2 border border-accent/40 rounded-xl px-5 py-3.5 flex items-center gap-3 shadow-lg shadow-accent/5">
      <Loader2 className="w-4 h-4 animate-spin text-accent" />
      <p className="text-sm text-slate-200 font-medium">
        Generando informe mediante Ollama...
      </p>
      <span className="text-xs font-mono text-accent font-semibold ml-auto bg-accent/10 px-2 py-0.5 rounded border border-accent/30">
        {seconds.toFixed(1)}s
      </span>
    </div>
  );
};
