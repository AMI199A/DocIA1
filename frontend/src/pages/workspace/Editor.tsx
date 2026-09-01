import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Save, Download } from "lucide-react";
import { toast } from "sonner";
import { fetchWithTimeout } from "@/services/api";

export const Editor: React.FC = () => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Borrador sin título");
  const [draftId, setDraftId] = useState<string | null>(null);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link", "image"],
      ["clean"],
    ],
  };

  const handleSave = async () => {
    try {
      const url = draftId ? `/api/v1/workspace/drafts/${draftId}` : "/api/v1/workspace/drafts";
      const method = draftId ? "PUT" : "POST";
      
      const res = await fetchWithTimeout(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (res.ok) {
        const data = await res.json();
        setDraftId(data.id);
        toast.success("Borrador guardado exitosamente.");
      } else {
        toast.error("Error al guardar el borrador.");
      }
    } catch (e) {
      toast.error("Error de conexión al guardar.");
    }
  };

  const handleExport = async () => {
    if (!content.trim()) {
      toast.error("El contenido está vacío.");
      return;
    }
    
    const toastId = toast.loading("Generando PDF...");
    try {
      const res = await fetchWithTimeout("/api/v1/workspace/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          toast.success("PDF generado.", { id: toastId });
          window.open(data.url, "_blank");
        } else {
          throw new Error("No URL in response");
        }
      } else {
        toast.error("Error al generar PDF", { id: toastId });
      }
    } catch (e) {
      toast.error("Error de conexión", { id: toastId });
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-transparent border-none outline-none text-2xl font-bold text-white placeholder-slate-500 w-full md:w-1/2"
          placeholder="Título del documento..."
        />
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-panel2 hover:bg-white/5 border border-line rounded-md text-sm text-slate-200 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent2 rounded-md text-sm text-white font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg overflow-hidden border border-line">
        <style>
          {`
            .ql-toolbar {
              border-top: none !important;
              border-left: none !important;
              border-right: none !important;
              border-bottom: 1px solid #e2e8f0 !important;
              background-color: #f8fafc;
            }
            .ql-container {
              border: none !important;
              font-size: 16px;
              color: #334155;
            }
            .ql-editor {
              min-height: 400px;
            }
          `}
        </style>
        <ReactQuill 
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          className="h-full flex flex-col"
        />
      </div>
    </div>
  );
};
